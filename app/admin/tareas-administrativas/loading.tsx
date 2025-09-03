import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="flex min-h-screen flex-col bg-[#0e2c52]">
      <div className="container mx-auto py-4 px-4 max-w-7xl">
        <Skeleton className="h-6 w-40 bg-gray-300/20" />
      </div>

      <div className="container mx-auto flex-1 flex flex-col items-center justify-start py-8 px-4">
        <div className="bg-white/10 rounded-lg p-6 w-full max-w-7xl">
          <Skeleton className="h-8 w-64 mx-auto mb-6 bg-gray-300/20" />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {Array(4)
              .fill(0)
              .map((_, i) => (
                <div key={i} className="border border-gray-300/20 rounded-lg p-6 flex flex-col items-center">
                  <Skeleton className="h-12 w-12 rounded-full mb-4 bg-gray-300/20" />
                  <Skeleton className="h-8 w-16 mb-2 bg-gray-300/20" />
                  <Skeleton className="h-4 w-24 bg-gray-300/20" />
                </div>
              ))}
          </div>

          <div className="flex justify-end mb-6">
            <Skeleton className="h-10 w-32 mr-2 bg-gray-300/20" />
            <Skeleton className="h-10 w-32 bg-gray-300/20" />
          </div>

          <div className="border border-gray-300/20 rounded-lg p-6">
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <Skeleton className="h-10 flex-1 bg-gray-300/20" />
              <div className="flex gap-2">
                <Skeleton className="h-10 w-40 bg-gray-300/20" />
                <Skeleton className="h-10 w-40 bg-gray-300/20" />
              </div>
            </div>

            <div className="space-y-4">
              {Array(5)
                .fill(0)
                .map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full bg-gray-300/20" />
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
