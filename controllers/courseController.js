import { catchAsyncError } from "../middlewares/catchAsyncError.js";
import { Course } from "../models/Course.js";
import { Stats } from "../models/Stats.js";
import getDataUri from "../utils/dataUri.js";
import ErrorHandler from "../utils/errorHandler.js";
import cloudinary from "cloudinary";  


// export const getAllCourses = async (req, res, next) => {
//   res.send("working");

//   try {
//     const courses = await Course.find();
//     res.status(200).json({
//       success: true,
//       courses,
//     });
//   } catch (error) {
//       console.log(error);
//   }
// };

// instead of try catch block above we will use CatchAsyncError.js file


// ------=====-------------// Get All Courses //-----------------========---------------------- // 

export const getAllCourses = catchAsyncError(async (req, res, next) => {

  const keyword = req.query.keyword || "";
  const category = req.query.category || "";

  const courses = await Course.find({
    title:{ 
      $regex:keyword,
      $options:"i", // i means case insensitive
    },
    category:{
      $regex:category,
      $options:"i", // i means case insensitive
    }
  }).select("-lectures");
  res.status(200).json({
    success: true,
    courses,
  });
});


// ----------=======---------// Create Course //--------------======------------------------- //

export const createCourse = catchAsyncError(async (req, res, next) => {
  const {title, description, category, createdBy} = req.body;

  if(!title || !description || !category || !createdBy){
    return next(new ErrorHandler("Please fill all the fields",400));
  }

      const file = req.file;
      // console.log(file);
     const fileUri =  getDataUri(file);

     const mycloud = await cloudinary.v2.uploader.upload(fileUri.content);
    

   await Course.create({
    title,
    description,
    category,
    createdBy,
    poster:{
      public_id : mycloud.public_id,
      url: mycloud.secure_url,
    },
  });

  res.status(201).json({
    success: true,
    message:"Course created successfully.You can now add lectures to this course.",
  });
});


// ----------=======---------// Get Course Lectures //--------------======------------------------- //
export const getCourseLectures = catchAsyncError(async (req, res, next) => {

  const course = await Course.findById(req.params.id);
 
   if(!course){
     return next(new ErrorHandler("Course not found",404));
   }
  
   course.views += 1;

   await course.save();


  res.status(200).json({
    success: true,
    lectures: course.lectures,
  });
});




// ----------=======---------// Add Course Lecture //-----------======------------- //

// max video size 100mb;
export const addLecture = catchAsyncError(async (req, res, next) => {

  
  const {id} = req.params;
  const {title , description} = req.body;
  
  
  const course = await Course.findById(id);
 
   if(!course){
     return next(new ErrorHandler("Course not found",404));
   }
  
  
   const file = req.file;
   // console.log(file);
  const fileUri =  getDataUri(file);
 
  // upload image to cloudinary
  const mycloud = await cloudinary.v2.uploader.upload(
    fileUri.content,
    {
      resource_type:"video",
      
    }
   );
 
   


   course.lectures.push({
      title,
      description,
      video: {
        public_id : mycloud.public_id,
        url : mycloud.secure_url,
      },
   });

   course.numOfVideos = course.lectures.length;

   await course.save();

  res.status(200).json({
    success: true,
    message: "Lecture added in course successfully",
  });
  
});


// ----------=======---------// Delete Course //-----------======-------------- //

export const deleteCourse = catchAsyncError(async (req, res, next) => {
  
  const {id} = req.params;
  
  const course = await Course.findById(id);

  if(!course){
    return next(new ErrorHandler("Course not found",404));
  }
 
  
  await cloudinary.v2.uploader.destroy(course.poster.public_id);

  for(let i=0; i<course.lectures.length; i++){
    const singleLecture = course.lectures[i];
    await cloudinary.v2.uploader.destroy(singleLecture.video.public_id,{
      resource_type:"video",
    });
    
  }
 
  await course.deleteOne();

  res.status(200).json({
    success: true,
    message:"Course deleted successfully",
  });

});




// ----------=======---------// Delete Lecture //------------======---------------- //

export const deleteLecture = catchAsyncError(async (req, res, next) => {
  
  // first find courseId and lectureId then delete it
  const {courseId , lectureId} = req.query;
 
  console.log(courseId , lectureId);

  // find course using courseId
  const course = await Course.findById(courseId);

  

 // if course not found then return error
  if(!course){
    return next(new ErrorHandler("Course not found",404));
  }

  // if course found then find lecture then delete it
  const lecture = course.lectures.find((item) => {
    if(item._id.toString() === lectureId.toString()){
      return item;
     
    }
  });

    console.log(lecture);

   // delete lecture video from cloudinary 
   await cloudinary.v2.uploader.destroy(lecture.video.public_id,{
      resource_type:"video",
    });
    
  // delete lecture from course using filter method from array or mongodb
    course.lectures = course.lectures.filter(item =>{
      if(item._id.toString() !== lectureId.toString()){
        return item;
      }
    })
 
   course.numOfVideos = course.lectures.length;

   await course.save();

  res.status(200).json({
    success: true,
    message:"Lecture deleted successfully",
  });

});



// Need to update the Collection of Stats in Database(MongoDb) everytime Course is created or watched by the User to maintain the stats of the dashboard
// Course Watch For checking if new user is updated in the Users Collection  Database(MongoDb)

Course.watch().on("change", async () => {
  const stats = await Stats.find({}).sort({createdAt:"desc"}).limit(1);

  const courses = await Course.find({});

 let totalViews = 0;

  for(let i = 0 ; i < courses.length ; i++){
    
    totalViews += courses[i].views;
  }

  stats[0].views = totalViews;

  stats[0].createdAt = new Date(Date.now());
  
  await stats[0].save();  
  

});