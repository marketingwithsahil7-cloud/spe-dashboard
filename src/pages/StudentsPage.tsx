import { useState, useCallback, lazy, Suspense } from 'react'
import { usePullToRefresh } from '../hooks/usePullToRefresh'
import { PageGlow } from '../components/ui/PageGlow'
import { PullToRefreshIndicator } from '../components/ui/PullToRefresh'

const AmbientBackground = lazy(() => import('../components/ui/AmbientBackground'))
import { useStudents } from '../hooks/useStudents'
import { StudentList } from '../components/students/StudentList'
import { StudentForm } from '../components/students/StudentForm'
import type { StudentWithFee } from '../hooks/useStudents'

export default function StudentsPage() {
  const { students, isLoading, error, addStudent, updateStudent, uploadPhoto, refetch } =
    useStudents()

  const [drawerOpen,      setDrawerOpen]      = useState(false)
  const [editingStudent,  setEditingStudent]  = useState<StudentWithFee | null>(null)

  const handleAdd = () => {
    setEditingStudent(null)
    setDrawerOpen(true)
  }

  const handleEdit = (student: StudentWithFee) => {
    setEditingStudent(student)
    setDrawerOpen(true)
  }

  const handleClose = useCallback(() => {
    setDrawerOpen(false)
    setEditingStudent(null)
  }, [])

  const { pullY, refreshing } = usePullToRefresh(refetch)

  return (
    <>
      <PullToRefreshIndicator pullY={pullY} refreshing={refreshing} />
    <div className="relative">
      <PageGlow variant="green" />
      <Suspense fallback={null}><AmbientBackground variant="students" /></Suspense>
      <StudentList
        students={students}
        isLoading={isLoading}
        error={error}
        onAdd={handleAdd}
        onEdit={handleEdit}
      />

      <StudentForm
        isOpen={drawerOpen}
        onClose={handleClose}
        student={editingStudent}
        onAdd={addStudent}
        onUpdate={updateStudent}
        onUploadPhoto={uploadPhoto}
      />
    </div>
    </>
  )
}
