3.1.1. View Post Parent
  
●	View posts list: Display all approved posts in a comprehensive list showing author, timestamp, content, images, like count, and comment count with proper scrolling. 
●	Filter and search posts: Use advanced filtering system with keyword search field (author, content) and multiple category tabs (All, School, Class, Parent, My Posts) to quickly locate specific posts. 
●	Filter by date range: Use date picker filters for "From Date" and "To Date" to filter posts within a specific time period. 
●	Create new post: Access the post creation form through the "+ Create Post" button to initiate a new post creation process. 
●	View post details: Access detailed information for each post including full content, all images, and all comments through clicking on the post card. 
●	Edit existing posts: Modify own posts through the edit icon (gear) in the actions menu dropdown, with role-based permissions allowing parents to only edit their own posts. 
●	Delete existing posts: Remove own posts through the delete option in the actions menu dropdown, with role-based permissions allowing parents to only delete their own posts. 
●	Like and comment on posts: Interact with posts through like button and comment button to engage with the community. 
●	View list of users who liked the post: Access the list of users who liked a specific post by clicking on the like count to see all users who have liked the post. 
●	View list of comments: Access the list of comments for a specific post by clicking on the comment count to see all comments with author, content, and timestamp. 
●	Refresh post data: Update the current post list by scrolling or refreshing the page to get the latest data from the server. 
●	Clear search filters: Reset all applied filters using the "All" category tab to return to the unfiltered view of all posts. 
●	Monitor post status: View only approved posts in the main feed, with pending posts visible only in "My Posts" category. 
On the screen, parent can also: 
●	Navigate between different sections: Access other parent functions through the sidebar navigation including Dashboard, Children Info, Calendar, Daily Reports, Fees, Health Records, and Complaints. 
●	View user information: See current user details and role (parent) in the top navigation bar. 
Field Name 	Description 
(1) Author 	Data type: string. Retrieved from post.user_id.full_name and displayed with avatar (post.user_id.avatar_url) in post header (e.g., School Admin, Teacher Name, Parent Name) 
(2) Timestamp 	Data type: date. Retrieved from post.create_at and displayed in format "DD/MM/YYYY lúc HH:mm" (e.g., 29/11/2025 lúc 17:32) 
(3) Content 	Data type: string, max length suitable for post content. Retrieved from post.content and displayed in post body 
(4) Images 	Data type: array of image URLs. Retrieved from post.images[] (PostImage collection) and displayed as image gallery in post body 
(5) Like 	Data type: positive integer for count, boolean for is_liked status, array of user objects for liked users list. Retrieved from PostLike.countDocuments({ post_id }) for count, PostLike.findOne({ post_id, user_id }) for is_liked status, and PostLike.find({ post_id }).populate('user_id', 'full_name avatar_url') for liked users list. Displayed next to like button with count (e.g., (0), (5)) and clickable to view list of users who liked the post. Like button highlighted if user has liked the post (is_liked = true). 
(6) Comment 	Data type: positive integer for count, array of comment objects for comments list. Retrieved from PostComment.countDocuments({ post_id }) for count and PostComment.find({ post_id }).populate('user_id', 'full_name avatar_url') for comments list with fields: comment content, author (user_id.full_name, user_id.avatar_url), and timestamp (create_at). Displayed next to comment button with count (e.g., (0), (3)) and clickable to view list of all comments for the post. 
(7) Category 	Data type: string, enum values. Determined by post.user_id.role and displayed as category tabs: "All" (all posts), "School" (school_admin role), "Class" (teacher role), "Parent" (parent role), "My Posts" (current user's posts) 
(8) Search Keyword 	Data type: string. Used to filter posts by matching author name (user_id.full_name) or content (post.content) 
(9) Date Range 	Data type: date range with from_date and to_date. Used to filter posts created within a specific time period. From Date filters posts created on or after this date (post.create_at >= from_date) and To Date filters posts created on or before this date (post.create_at <= to_date). Both dates are displayed as date picker inputs with format "mm/dd/yyyy". 
(10) Status 	Data type: string, enum values. Retrieved from post.status and used internally (only 'approved' posts shown in main feed, 'pending' posts shown in "My Posts")

