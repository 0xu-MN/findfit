export default function ReportDetailPage({ params }: { params: { id: string } }) {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">AI 리포트</h1>
      <p className="text-gray-500 mt-2">ID: {params.id}</p>
    </div>
  )
}
