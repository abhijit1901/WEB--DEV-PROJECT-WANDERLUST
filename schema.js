const Joi = require('joi');
const review = require('./models/review');

module.exports.listingSchema = Joi.object({
    listing: Joi.object({
        title: Joi.string().pattern(/[a-zA-Z]/).required(),
        description: Joi.string()
            .pattern(/([a-zA-Z]|[\d]|[!@#$%^&*(),.?":{}|<>])/)
            .required(),
        image: Joi.string().allow("", null),
        price: Joi.number().required().min(1),
        location: Joi.string().pattern(/[a-zA-Z]/).required(),
        country: Joi.string().pattern(/[a-zA-Z]/).required(),
        categories: Joi.array().items(Joi.string().valid(
            'rooms', 
            'iconic-cities', 
            'historic', 
            'sea',
            'mountain', 
            'castle', 
            'amazing-pools', 
            'camping', 
            'farms', 
            'arctic', 
            'trending'
        )).default([])
    }).required()
});

module.exports.reviewSchema = Joi.object({
    review: Joi.object({
        rating: Joi.number().required().min(1).max(5),
        comment: Joi.string()
            .pattern(/([a-zA-Z]|[\d]|[!@#$%^&*(),.?":{}|<>])/)
            .required(),
    }).required()
}).required();