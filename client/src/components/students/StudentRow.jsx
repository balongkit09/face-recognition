import { Pencil, Trash2 } from 'lucide-react';
import InitialAvatar from '../dashboard/InitialAvatar';
import { BoxedPlusIcon } from '../common/BoxedPlusButton';

export default function StudentRow({ student, index, onEdit, onDelete, onEnrollFace, faceRequested }) {
  return (
    <tr className="border-t border-border-light">
      <td className="px-4 py-3 align-middle text-secondary font-medium text-slate-700">
        {student.idNumber}
      </td>
      <td className="px-4 py-3 align-middle text-secondary text-slate-700">
        {student.edpCode || '—'}
      </td>
      <td className="px-4 py-3 align-middle">
        <div className="flex items-center gap-2.5">
          <InitialAvatar name={student.name} tone={index + 2} />
          <span className="text-body font-semibold text-slate-900">{student.name}</span>
        </div>
      </td>
      <td className="px-4 py-3 align-middle text-secondary text-slate-700">
        {student.program}
      </td>
      <td className="px-4 py-3 align-middle text-secondary text-slate-500">
        {student.email}
      </td>
      <td className="px-4 py-3 align-middle">
        <div className="flex items-center gap-1">
          {onEnrollFace && (
            <BoxedPlusIcon
              onClick={() => onEnrollFace(student)}
              disabled={faceRequested || student.faceEnrolled}
              label={
                student.faceEnrolled
                  ? `${student.name} is already enrolled`
                  : faceRequested
                    ? `Face enroll already requested for ${student.name}`
                    : `Enroll face for ${student.name}`
              }
              title={
                student.faceEnrolled
                  ? 'Already enrolled'
                  : faceRequested
                    ? 'Face enroll request pending'
                    : 'Enroll Face'
              }
            />
          )}
          <button
            type="button"
            onClick={() => onEdit(student)}
            className="rounded-md p-1.5 text-slate-500 hover:bg-[#f8fafc]"
            aria-label={`Edit ${student.name}`}
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(student)}
            className="rounded-md p-1.5 text-slate-500 hover:bg-[#f8fafc]"
            aria-label={`Delete ${student.name}`}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}
