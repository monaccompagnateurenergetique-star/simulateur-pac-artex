import HistoryList from '../components/history/HistoryList'

export default function HistoryPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      <HistoryList showViewAll={false} showDelete={true} />
    </div>
  )
}
