export default function SkeletonApprovalRow() {
  return (
    <tr className="animate-pulse">
      <td className="py-4 px-6">
        <div className="h-6 w-32 bg-slate-200 rounded-lg" />
      </td>
      <td className="py-4 px-6 space-y-1.5">
        <div className="h-4 w-48 bg-slate-200 rounded" />
        <div className="h-3 w-28 bg-slate-100 rounded" />
      </td>
      <td className="py-4 px-6">
        <div className="h-5 w-16 bg-slate-200 rounded-md" />
      </td>
      <td className="py-4 px-6">
        <div className="h-4 w-28 bg-slate-200 rounded" />
      </td>
      <td className="py-4 px-6 space-y-1">
        <div className="h-5 w-24 bg-slate-200 rounded-full" />
        <div className="h-1.5 w-20 bg-slate-100 rounded-full" />
      </td>
      <td className="py-4 px-6">
        <div className="h-4 w-20 bg-slate-200 rounded" />
      </td>
      <td className="py-4 px-6 text-right">
        <div className="h-8 w-24 bg-slate-200 rounded-xl ml-auto" />
      </td>
    </tr>
  );
}
