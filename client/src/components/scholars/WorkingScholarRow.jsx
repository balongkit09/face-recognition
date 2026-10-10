import { Pencil, Trash2 } from 'lucide-react';
import InitialAvatar from '../dashboard/InitialAvatar';
import DesignationBadge from './DesignationBadge';
import { BoxedPlusIcon } from '../common/BoxedPlusButton';

export default function WorkingScholarRow({ scholar, index, onEdit, onDelete, onEnrollFace }) {
  return (
    <tr className="border-t border-border-light">
      <td className="px-4 py-3 align-middle text-secondary font-medium text-slate-700">
        {scholar.idNumber}
      </td>
      <td className="px-4 py-3 align-middle">
        <div className="flex items-center gap-2.5">
          <InitialAvatar name={scholar.name} tone={index + 1} />
          <span className="text-body font-semibold text-slate-900">{scholar.name}</span>
        </div>
      </td>
      <td className="px-4 py-3 align-middle">
        <DesignationBadge designation={scholar.designation} />
      </td>
      <td className="px-4 py-3 align-middle text-secondary text-slate-500">{scholar.email}</td>
      <td className="px-4 py-3 align-middle">
        <div className="flex items-center gap-1">
          {onEnrollFace && (
            <BoxedPlusIcon
              onClick={() => onEnrollFace(scholar)}
              disabled={scholar.faceEnrolled}
              label={
                scholar.faceEnrolled
                  ? `${scholar.name} is already enrolled`
                  : `Enroll face for ${scholar.name}`
              }
              title={scholar.faceEnrolled ? 'Already enrolled' : 'Enroll Face'}
            />
          )}
          <button
            type="button"
            onClick={() => onEdit(scholar)}
            className="rounded-md p-1.5 text-slate-500 hover:bg-[#f8fafc]"
            aria-label={`Edit ${scholar.name}`}
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(scholar)}
            className="rounded-md p-1.5 text-slate-500 hover:bg-[#f8fafc]"
            aria-label={`Delete ${scholar.name}`}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}
