import { useState, useCallback, lazy, Suspense } from 'react'
import { usePullToRefresh } from '../hooks/usePullToRefresh'
import { PageGlow } from '../components/ui/PageGlow'
import { PullToRefreshIndicator } from '../components/ui/PullToRefresh'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { useToast } from '../components/ui/Toast'

const AmbientBackground = lazy(() => import('../components/ui/AmbientBackground'))
import { useStudents } from '../hooks/useStudents'
import { StudentList } from '../components/students/StudentList'
import { StudentForm } from '../components/students/StudentForm'
import type { StudentWithFee } from '../hooks/useStudents'

export default function StudentsPage() {
  const { students, isLoading, error, addStudent, updateStudent, deleteStudent, uploadPhoto, refetch } =
    useStudents()
  const toast = useToast()

  const [drawerOpen,      setDrawerOpen]      = useState(false)
  const [editingStudent,  setEditingStudent]  = useState<StudentWithFee | null>(null)
  const [deleteTarget,    setDeleteTarget]    = useState<StudentWithFee | null>(null)
  const [deleting,        setDeleting]        = useState(false)

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

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteStudent(deleteTarget.id)
      toast.success(`${deleteTarget.name} removed`)
      setDeleteTarget(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete student')
    } finally {
      setDeleting(false)
    }
  }

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
        onDelete={setDeleteTarget}
      />

      <StudentForm
        isOpen={drawerOpen}
        onClose={handleClose}
        student={editingStudent}
        onAdd={addStudent}
        onUpdate={updateStudent}
        onUploadPhoto={uploadPhoto}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title={`Remove ${deleteTarget?.name ?? ''}?`}
        description={`Are you sure you want to remove ${deleteTarget?.name ?? 'this student'}? This will delete all their attendance, fee records, and data.`}
        confirmLabel="Delete Student"
        variant="danger"
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
    </>
  )
}
