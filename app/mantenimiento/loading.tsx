import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="container mx-auto max-w-4xl">
      <div className="flex flex-col space-y-4">
        <div className="flex items-center mb-2">
          <Skeleton className="h-6 w-6 mr-3" />
          <Skeleton className="h-8 w-64" />
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <Skeleton className="h-10 flex-1" />
          <div className="flex space-x-2">
            <Skeleton className="h-8 w-16 rounded-full" />
            <Skeleton className="h-8 w-20 rounded-full" />
            <Skeleton className="h-8 w-24 rounded-full" />
            <Skeleton className="h-8 w-24 rounded-full" />
          </div>
        </div>

        <div className="space-y-4">
          {Array(5)
            .fill(0)
            .map((_, i) => (
              <div key={i} className="overflow-hidden rounded-lg border border-gray-200 p-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-64" />
                    <Skeleton className="h-4 w-full max-w-md" />
                  </div>
                  <Skeleton className="h-6 w-24 rounded-full" />
                </div>

                <div className="flex flex-wrap gap-2 mt-3">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-4 w-36" />
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  )
}
