import { Skeleton } from "@/components/ui/skeleton"

export default function AuxiliarReportesLoading() {
  return (
    <div className="bg-white rounded-lg p-6 w-full">
      <div className="flex justify-between items-center mb-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-32" />
      </div>

      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="border rounded-lg p-4">
            <div className="flex justify-between items-start">
              <div className="w-full">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-1/3 mb-2" />
              </div>
              <Skeleton className="h-6 w-20" />
            </div>
            <div className="mt-4 flex justify-end space-x-2">
              <Skeleton className="h-9 w-24" />
              <Skeleton className="h-9 w-20" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
