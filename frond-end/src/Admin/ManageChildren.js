// "use client"

// import { useState, useEffect } from "react"
// import api from "services/api"
// import Sidebar from "./Sidebar"
// import Header from "./Header"
// import "./style.css"

// export default function ManageChildren() {
//     const [students, setStudents] = useState([])
//     const [loading, setLoading] = useState(false)
//     const [sidebarOpen, setSidebarOpen] = useState(true)
//     const [activeSection, setActiveSection] = useState("children")
//     const [activeSectionLabel, setActiveSectionLabel] = useState("Danh sách học sinh")



//     useEffect(() => {
//         if (typeof window !== "undefined") {
//             const params = new URLSearchParams(window.location.search)
//             const classId = params.get("classId")
//             if (classId) {
//                 const fetchStudents = async () => {
//                     try {
//                         setLoading(true)
//                         const res = await api.get(`/student/class/${classId}`, true)
//                         // đảm bảo students luôn là mảng
//                         setStudents(Array.isArray(res) ? res : res.students || [])
//                     } catch (err) {
//                         console.error(err)
//                     } finally {
//                         setLoading(false)
//                     }
//                 }
//                 fetchStudents()
//             }
//         }
//     }, [])

//     return (
//         <div className="admin-container">
//             <Sidebar
//                 sidebarOpen={sidebarOpen}
//                 setSidebarOpen={setSidebarOpen}
//                 activeSection={activeSection}
//                 setActiveSection={setActiveSection}
//             />

//             <div className={`admin-main ${sidebarOpen ? "" : "closed"}`}>
//                 <Header
//                     sidebarOpen={sidebarOpen}
//                     setSidebarOpen={setSidebarOpen}
//                     activeSectionLabel={activeSectionLabel}
//                 />

//                 <div className="admin-content">
//                     <h2>Danh sách học sinh</h2>
//                     {loading ? (
//                         <p>Đang tải dữ liệu...</p>
//                     ) : (
//                         <table className="classes-table">
//                             <thead>
//                                 <tr>
//                                     <th>Họ và tên</th>
//                                     <th>Ngày sinh</th>
//                                     <th>Giới tính</th>
//                                     <th>Trạng thái</th>
//                                 </tr>
//                             </thead>
//                             <tbody>
//                                 {students.map((s) => (
//                                     <tr key={s._id}>
//                                         <td>{s.full_name}</td>
//                                         <td>{s.dob}</td>
//                                         <td>{s.gender === 0 ? "Nữ" : s.gender === 1 ? "Nam" : "-"}</td>
//                                         <td>{s.status === 0 ? "Không hoạt động" : s.status === 1 ? "Hoạt động" : "-"}</td>
//                                     </tr>
//                                 ))}
//                             </tbody>
//                         </table>
//                     )}
//                 </div>
//             </div>
//         </div>
//     )
// }
