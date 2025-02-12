const Listing = require("../models/listing");

async function getCoordinates(location, country) {
    const fetch = (await import('node-fetch')).default;
    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${location},${country}`);
    const data = await response.json();
    if (data.length > 0) {
        return {
            latitude: data[0].lat,
            longitude: data[0].lon
        };
    }
    return null;
}

module.exports.index = async (req, res) => {
    let allListings = await Listing.find({});

    // Validate and sanitize listings to avoid null or undefined properties
    allListings = allListings.map((listing) => ({
        ...listing.toObject(), // Convert Mongoose document to a plain object
        price: listing.price || 0, // Default price to 0 if null or undefined
        image: listing.image || { url: "/default-image.jpg" }, // Placeholder for missing image
        title: listing.title || "Untitled", // Default title if missing
    }));

    res.render("listings/index.ejs", { allListings });
}

module.exports.renderNewForm = (req, res) => {
    res.render("listings/new.ejs");
}

module.exports.showListing = async (req, res) => {
    const { id } = req.params;
    const listing = await Listing
        .findById(id)
        .populate({
            path: "reviews",
            populate: {
                path: "author"
            },
        })
        .populate("owner");

    if (!listing) {
        req.flash("error", "Listing not found or it do not exist");
        res.redirect("/listings");
    }

    // Ensure price has a fallback value if it's missing
    listing.price = listing.price || 0;
    res.render("listings/show.ejs", { listing });
}

module.exports.createListing = async (req, res) => {
    try {
        let url = req.file.path;
        let fileName = req.file.filename;
        const newListing = new Listing(req.body.listing);
        const { location, country } = req.body.listing;
        const coordinates = await getCoordinates(location, country);
        if (coordinates) {
            req.body.listing.latitude = coordinates.latitude;
            req.body.listing.longitude = coordinates.longitude;
        }
        // Define valid categories
        const validCategories = [
            'rooms', 'iconic-cities', 'mountain', 'castle', 'historic', 'sea',
            'amazing-pools', 'camping', 'farms', 'arctic', 'trending'
        ];

        // Handle categories with validation
        newListing.categories = Array.isArray(req.body.listing.categories)
            ? req.body.listing.categories.filter(cat => validCategories.includes(cat))
            : [];

        // Ensure at least one valid category
        if (newListing.categories.length === 0) {
            throw new Error("At least one valid category must be selected");
        }

        newListing.owner = req.user._id;
        newListing.image = { url, fileName };

        console.log("Categories being saved:", newListing.categories);
        await newListing.save();

        req.flash("success", "Successfully added a new listing");
        res.redirect("/listings");
    } catch (err) {
        console.log("Error creating listing:", err);
        req.flash("error", err.message || "Error creating listing");
        res.redirect("/listings/new");
    }
};

module.exports.renderEditForm = async (req, res) => {
    const { id } = req.params;
    const listing = await Listing.findById(id);
    if (!listing) {
        req.flash("error", "Listing not found or it do not exist");
        res.redirect("/listings");
    }
    let originalImageUrl = listing.image.url;
    originalImageUrl = originalImageUrl.replace("/upload", "/upload/h_300,w_250")
    console.log("Request Body:", req.body);
    res.render("listings/edit.ejs", { listing, originalImageUrl });
}

module.exports.updateListing = async (req, res) => {
    const { id } = req.params;
    const { location, country } = req.body.listing;
    const coordinates = await getCoordinates(location, country);
    if (coordinates) {
        req.body.listing.latitude = coordinates.latitude;
        req.body.listing.longitude = coordinates.longitude;
    }

    // Debugging: Log the entire request body
    console.log("Request Body:", req.body);

    let updateData = { ...req.body.listing };

    // Debugging: Check what categories look like
    console.log("Categories Before Processing:", req.body.listing.categories);

    // Handle categories safely
    updateData.categories = Array.isArray(req.body.listing.categories)
        ? req.body.listing.categories
        : [];

    console.log("Processed Categories:", updateData.categories);

    // If a new image was uploaded, update the image data
    if (req.file) {
        updateData.image = {
            url: req.file.path,
            fileName: req.file.filename
        };
    }

    // Debugging: Final data before saving
    console.log("Final Update Data:", updateData);

    await Listing.findByIdAndUpdate(id, updateData, { runValidators: true });
    req.flash("success", "Listing Updated Successfully");
    res.redirect(`/listings/${id}`);
};

module.exports.destroyListing = async (req, res) => {
    const { id } = req.params;
    await Listing.findByIdAndDelete(id);
    req.flash("success", "Listing Deleted Successfully ");
    res.redirect("/listings");
}