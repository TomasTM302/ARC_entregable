import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="flex min-h-screen flex-col bg-[#0e2c52]">
      <div className="container mx-auto py-4 px-4 max-w-7xl">
        <Skeleton className="h-6 w-40 bg-gray-300" />
      </div>

      <div className="container mx-auto flex-1 flex flex-col items-center justify-start py-8 px-4">
        <div className="bg-white rounded-lg p-6 w-full max-w-6xl mb-8">
          <Skeleton className="h-8 w-64 mx-auto mb-6 bg-gray-300" />

          <div className="mb-8">
            <Skeleton className="h-10 w-full bg-gray-300" />
          </div>

          <div className="space-y-6">
            <Skeleton className="h-64 w-full bg-gray-300" />
          </div>
        </div>
      </div>
    </div>
  )
}
