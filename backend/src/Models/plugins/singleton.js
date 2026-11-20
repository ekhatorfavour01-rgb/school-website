'use strict';

module.exports = function singletonPlugin(schema) {
    schema.add({
        
        key: {
            type: String,
            default: 'main',
            unique: true,
            immutable: true,
            select: false
        },
    });

    schema.statics.getSingleton = async function getSingleton() {
        const existing = await this.findOne({
            key: 'main'
        });

        if (existing) return existing;

        try {
            return await this.create({
                key: 'main'
            });
        } catch (error) {
            
            if (error && error.code === 11000)
                return this.findOne({
                key: 'main'
            });

            throw error;

        }
        
    };
};