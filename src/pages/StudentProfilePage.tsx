import { useState } from 'react'
import { StudentProfile } from '../components/students/StudentProfile'
import { StudentForm } from '../components/students/StudentForm'
import { useStudents } from '../hooks/useStudents'
import type { StudentWithFee } from '../hooks/useStudents'

export default function StudentProfilePage() {
  const { addStudent, updateStudent, uploadPhoto } = useStudents()

  const [drawerOpen,     setDrawerOpen]     = useState(false)
  const [editingStudent, setEditingStudent] = useState<StudentWithFee | null>(null)

  const handleEdit = (student: StudentWithFee) => {
    setEditingStudent(student)
    setDrawerOpen(true)
  }

  const handleClose = () => {
    setDrawerOpen(false)
    setEditingStudent(null)
  }

  return (
    <>
      <StudentProfile onEdit={handleEdit} />

      <StudentForm
        isOpen={drawerOpen}
        onClose={handleClose}
        student={editingStudent}
        onAdd={addStudent}
        onUpdate={updateStudent}
        onUploadPhoto={uploadPhoto}
      />
    </>
  )
}
