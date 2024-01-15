import mongoose from 'mongoose';  

const schema = new mongoose.Schema({
    //title : type . required . minlength . maxlength
    title: {
        type: String,
        required: [true, 'Please enter a title'],
        minlength: [4, 'Minimum title length is 4 characters'],
        maxlength: [80, 'Maximum title length is 80 characters'],
    },

    //description : type . required . minlength 
    description: {
        type: String,
        required: [true, 'Please enter a description'],
        minlength: [20, 'Minimum description length is 20 characters'],
    },
    
    //Lectures : title , description videos {public_id , url}
    lectures: [
        {
            title: {
                type: String,
                required: true,
            },
            description: {
                type: String,
                required: true,
            },
            video: 
            
                {
                    public_id: {
                        type: String,
                        required: true,
                    },
                    url: {
                        type: String,
                        required: true,
                    },
                },
            
        },
    ],

    //poster : public_id , url
    poster: {
        public_id: {
            type: String,
            required: true,
        },
        url: {
            type: String,
            required: true,
        },
    },
    //Views : type . default
    views: {
        type: Number,
        default: 0,
    },
    //NumofVideos : type . default
    numOfVideos: {
        type: Number,
        default: 0,
    },

    //category : type . required
    category: {
        type: String,
        required: [true, 'Please select a category for this course'],
    },

    //createdBy : type . required
    createdBy: {
        type: String,
        required: [true, 'Please enter a creator name'],
    },

    //createdAt : type . default
    createdAt: {
        type: Date,
        default: Date.now,
    },


});

 export const Course = mongoose.model( "Course", schema); 


 