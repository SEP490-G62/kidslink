3.1.1. View Posts School Admin
  
●	View posts list: Display all posts (pending and approved) in a comprehensive list showing author, status, timestamp, content, images, like count, and comment count with proper scrolling. 
●	View post statistics: Display summary cards showing total posts count, pending posts count (with warning indicator), and approved posts count (with success indicator) at the top of the page. 
●	Filter and search posts: Use advanced filtering system with keyword search field (author, content, class) and multiple category tabs (All, School, Teacher, Parent) to quickly locate specific posts. 
●	Filter by date range: Use date picker filters for "From Date" and "To Date" to filter posts within a specific time period. 
●	Create new post: Access the post creation form through the "+ Create Post" button to initiate a new post creation process. 
●	View post details: Access detailed information for each post including full content, all images, and all comments through clicking on the post card. 
●	Approve posts: Approve pending posts through the "Approve" option in the actions menu dropdown, changing post status from pending to approved. 
●	Reject posts: Reject pending posts through the "Reject" option in the actions menu dropdown, changing post status from approved to pending. 
●	Delete existing posts: Remove any post through the delete option in the actions menu dropdown, with full administrative permissions to delete any post in the school. 
●	Like and comment on posts: Interact with posts through like button and comment button to engage with the community. 
●	View list of users who liked the post: Access the list of users who liked a specific post by clicking on the like count to see all users who have liked the post. 
●	View list of comments: Access the list of comments for a specific post by clicking on the comment count to see all comments with author, content, and timestamp. 
●	Refresh post data: Update the current post list by scrolling or refreshing the page to get the latest data from the server. 
●	Clear search filters: Reset all applied filters using the "All" category tab to return to the unfiltered view of all posts. 
●	Monitor post status: Track post status through status indicators including pending (orange chip "Đang chờ duyệt") and approved (green chip "Đã duyệt") displayed on each post card. 
On the screen, school admin can also: 
●	Navigate between different sections: Access other school admin functions through the sidebar navigation including Dashboard, Manage Contracts, Manage Debt, Manage Export Orders, Create Bills, Calendar, Complaints, and School Settings. 
●	View user information: See current user details and role (school admin) in the top navigation bar. 
Field Name 	Description 
(1) Total Posts 	Data type: positive integer. Calculated from Post.countDocuments({ school_id }) and displayed in summary card showing total number of posts in the system with percentage indicator 
(2) Pending Posts 	Data type: positive integer. Calculated from Post.countDocuments({ status: 'pending', school_id }) and displayed in summary card with warning indicator showing number of posts awaiting approval 
(3) Approved Posts 	Data type: positive integer. Calculated from Post.countDocuments({ status: 'approved', school_id }) and displayed in summary card with success indicator showing number of approved posts 
(4) Author 	Data type: string. Retrieved from post.user_id.full_name and displayed with avatar (post.user_id.avatar_url) in post header (e.g., School Admin, Teacher Name, Parent Name) 
(5) Status 	Data type: string, enum values. Retrieved from post.status and displayed as colored chips: pending (orange chip "Đang chờ duyệt"), approved (green chip "Đã duyệt") 
(6) Timestamp 	Data type: date. Retrieved from post.create_at and displayed in format "DD/MM/YYYY lúc HH:mm" (e.g., 29/11/2025 lúc 18:20) 
(7) Content 	Data type: string, max length suitable for post content. Retrieved from post.content and displayed in post body 
(8) Images 	Data type: array of image URLs. Retrieved from post.images[] (PostImage collection) and displayed as image gallery in post body 
(9) Like 	Data type: positive integer for count, boolean for is_liked status, array of user objects for liked users list. Retrieved from PostLike.countDocuments({ post_id }) for count, PostLike.findOne({ post_id, user_id }) for is_liked status, and PostLike.find({ post_id }).populate('user_id', 'full_name avatar_url') for liked users list. Displayed next to like button with count (e.g., (0), (5)) and clickable to view list of users who liked the post. Like button highlighted if user has liked the post (is_liked = true). 
(10) Comment 	Data type: positive integer for count, array of comment objects for comments list. Retrieved from PostComment.countDocuments({ post_id }) for count and PostComment.find({ post_id }).populate('user_id', 'full_name avatar_url') for comments list with fields: comment content, author (user_id.full_name, user_id.avatar_url), and timestamp (create_at). Displayed next to comment button with count (e.g., (0), (3)) and clickable to view list of all comments for the post. 
(11) Category 	Data type: string, enum values. Determined by post.user_id.role and displayed as category tabs: "All" (all posts), "School" (school_admin role), "Teacher" (teacher role), "Parent" (parent role) 
(12) Search Keyword 	Data type: string. Used to filter posts by matching author name (user_id.full_name), content (post.content), or class name (class_id.class_name) 
(13) Date Range 	Data type: date range with from_date and to_date. Used to filter posts created within a specific time period. From Date filters posts created on or after this date (post.create_at >= from_date) and To Date filters posts created on or before this date (post.create_at <= to_date). Both dates are displayed as date picker inputs with format "mm/dd/yyyy". 
(14) Class Name 	Data type: string. Retrieved from post.class_id.class_name and used in search filter to find posts by class name

