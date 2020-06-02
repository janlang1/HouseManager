# HouseManager
Web app used to track tenants and houses including leases, documents, and a discussion forum
Link: https://agohousemanager.herokuapp.com/

Mongodb as the database

Express.js and bootstrap as the template for the app and front-end

Node.js as the runtime environment to run everything in Javascript with its npm libraries

Heroku, Cloudinary, and Mongo atlas as cloud services to host the website, images, documents, and database.

Future Implementations:
-React as the front-end framework
-Cascading deletes from database
-More features like rent tracking and payment methods

*edge cases that were not checked:
  1. When call to MongoDB house returns a null (not an error or object) website breaks
    
    FIX: Check for null for campgrounds (check ownership) and for show.js then add flash and redirect
  2. When call to MongoDB comment returns 
    
    FIX: Check for null for comments (check ownership) and for show.js then add flash and redirect
    Need to do this for comment edit route too 

Can use nested if statement in the function call back for the route
