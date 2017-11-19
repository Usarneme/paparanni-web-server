# Paparanni Photo Blog

Photo blog website written in ExpressJS, a NodeJS Web Framework. 

Uses PUG template files and a MongoDB data store. 
Allows a logged in administrator user to upload image files which, upon upload, creates a database entry with ID, name, and optional tags which are keywords related to the photo, and a thumbnail version of the image scaled to 510px wide and placed in the thumbs/ directory. 
The photos are then appended to the main photo-blog page (the / route) and their thumbnail displayed in a flexbox-defined, responsive grid. 
All tags are displayed and photos can be sorted by one or more tags. 
Administrator user can also delete photos (which removes their original-sized file, thumbnail-sized file, and databse entry). 
All displayed photos can be viewed in a lightbox gallery by clicking on them. Touch swiping, keyboard arrow keys, and mouse control buttons are available for switching between photos or closing the lightbox gallery. 
Front-end styled with SASS-compiled into CSS with vendor-prefixes for cross browser compatibility.
Simple, clean, and well-organized. 
