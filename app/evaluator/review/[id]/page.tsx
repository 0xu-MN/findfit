export default function ReviewPage({ params }: { params: { id: string } }) {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">평가 진행</h1>
      <p className="text-gray-500 mt-2">ID: {params.id}</p>
    </div>
  )
}
