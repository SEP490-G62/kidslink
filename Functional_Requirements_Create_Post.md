3.1.2. Create Post
  
●	Open create post modal: Access the post creation form through the "+ Create Post" button to open a modal dialog for creating a new post. 
●	Enter post content: Input post content in the multi-line text area with placeholder "Chia sẻ điều gì đó với cộng đồng..." (Share something with the community...). Content field is required and must not be empty. 
●	Upload images: Add images to the post by clicking the "Chọn ảnh" (Select photos) button to open file picker, allowing multiple image selection. Selected images are displayed as previews with count indicator showing number of uploaded images (e.g., "Thêm ảnh (0)"). 
●	Preview uploaded images: View thumbnail previews of all selected images in a grid layout before posting. Each preview shows the image with a remove button (X) in the top right corner to delete individual images. 
●	Remove uploaded images: Delete individual images from the post by clicking the remove button (X) on each image preview before submitting the form. 
●	Validate post content: Ensure post content is not empty before submission. Display error message "Vui lòng nhập nội dung bài viết" (Please enter post content) if content field is empty when attempting to submit. 
●	Submit post: Create and publish the post by clicking the "Đăng bài viết" (Post) button. Post is created with status 'pending' for parent role and 'approved' for school admin role. Images are uploaded to Cloudinary and saved to database. 
●	Cancel post creation: Close the create post modal without saving by clicking the "Hủy" (Cancel) button or the close icon (X) in the modal header. All entered content and selected images are cleared when modal is closed. 
●	View loading state: Display loading indicator on the submit button ("Đang đăng..." - Posting...) while the post is being created and images are being uploaded to prevent duplicate submissions. 
●	Handle post creation success: Close the modal and refresh the post list automatically after successful post creation. Display success message "Đăng bài thành công" (Post created successfully). 
●	Handle post creation errors: Display error messages if post creation fails, such as "Có lỗi xảy ra khi tạo bài đăng" (An error occurred while creating the post) or specific validation errors. 
On the screen, user can also: 
●	Navigate between different sections: Access other functions through the sidebar navigation depending on user role (parent, teacher, or school admin). 
●	View user information: See current user details and role in the top navigation bar. 
Field Name 	Description 
(1) Post Content 	Data type: string, required field, max length suitable for post content. Input in multi-line text area with placeholder "Chia sẻ điều gì đó với cộng đồng...". Retrieved from request body content field and saved to post.content in database. Must not be empty, validation error displayed if empty on submit. 
(2) Images 	Data type: array of image files or base64 strings for image data, positive integer for image count. Selected through file picker with multiple selection enabled, accept="image/*". Images are converted to base64 for preview, then uploaded to Cloudinary storage, and saved as PostImage records with post_id and image_url. Image count is calculated from images array length and displayed in label "Thêm ảnh ({count})" to show number of selected images (e.g., "Thêm ảnh (2)"). Images are displayed as thumbnail previews with count indicator. Each image can be removed individually before submission. Image count updates dynamically as images are added or removed. 
(3) Post Status 	Data type: string, enum values ('pending', 'approved'). Automatically set based on user role: 'pending' for parent and teacher roles (requires approval), 'approved' for school admin role (auto-approved). Saved to post.status in database. 
(4) User ID 	Data type: ObjectId. Retrieved from authenticated user session (req.user.id) and saved to post.user_id to identify the post creator. 
(5) Class ID 	Data type: ObjectId, optional. For parent role, automatically determined from student's class (class with highest academic year). For teacher role, automatically determined from teacher's assigned class. For school admin, can be set to null for school-wide posts or specific class_id for class-specific posts. Saved to post.class_id in database. 
(6) Created At 	Data type: date. Automatically set to current timestamp when post is created. Saved to post.create_at in database and displayed in format "DD/MM/YYYY lúc HH:mm" in post list.

