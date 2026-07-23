export default async function RequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">의뢰 상세</h1>
      <p className="text-gray-500 mt-2">ID: {id}</p>
    </div>
  )
}
