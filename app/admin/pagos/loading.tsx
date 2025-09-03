import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <Skeleton className="h-8 w-64 mb-2" />
        <Skeleton className="h-4 w-96" />
      </div>

      <div className="mb-6">
        <Skeleton className="h-10 w-full mb-4" />

        <div className="grid grid-cols-1 gap-4">
          {Array(5)
            .fill(0)
            .map((_, i) => (
              <div key={i} className="bg-white rounded-lg p-4 shadow">
                <div className="flex justify-between items-center mb-4">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-6 w-24" />
                </div>

                <div className="space-y-3">
                  {Array(3)
                    .fill(0)
                    .map((_, j) => (
                      <div key={j} className="flex justify-between items-center">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 w-16" />
                      </div>
                    ))}
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  )
}
