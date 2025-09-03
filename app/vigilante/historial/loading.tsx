import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="bg-white rounded-lg p-6 w-full text-gray-800">
      <div className="flex justify-between items-center mb-6">
        <Skeleton className="h-8 w-64" />
      </div>

      <Skeleton className="h-10 w-full mb-6" />

      <div className="space-y-4">
        {Array(5)
          .fill(0)
          .map((_, i) => (
            <div key={i} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div className="flex items-start space-x-3">
                  <Skeleton className="h-9 w-9 rounded-full" />
                  <div>
                    <Skeleton className="h-6 w-40 mb-2" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
                <Skeleton className="h-6 w-12 rounded-full" />
              </div>

              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>

              <Skeleton className="h-10 w-full mt-2" />
            </div>
          ))}
      </div>
    </div>
  )
}
