import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="container mx-auto max-w-4xl">
      <div className="flex flex-col space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-full max-w-md" />

        <Skeleton className="h-10 w-full mb-4" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array(4)
            .fill(0)
            .map((_, i) => (
              <div key={i} className="overflow-hidden rounded-lg border border-gray-200">
                <Skeleton className="h-40 w-full" />
                <div className="p-4 space-y-2">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <div className="flex justify-between items-center">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-6 w-16 rounded-full" />
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  )
}
