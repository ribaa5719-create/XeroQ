import { AlertCircle, ArrowLeft, BarChart3, CheckCircle2, Clock3, FileText, LoaderCircle, RefreshCw, Store, Zap } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { analyticsApi } from '../services/analyticsApi'

const metricCards = [
  ['totalOrders', 'Total Orders', BarChart3],
  ['completedOrders', 'Completed Orders', CheckCircle2],
  ['pendingOrders', 'Pending Orders', Clock3],
  ['totalCompletedOrderValue', 'Completed Order Value', Store],
  ['averageWaitingTime', 'Average Queue Wait', Clock3],
  ['urgentOrders', 'Urgent Orders', Zap],
]

const formatMetric = (key, value) => {
  if (key === 'totalCompletedOrderValue') return `₹${Number(value || 0).toFixed(2)}`
  if (key === 'averageWaitingTime') return value === null ? 'No data yet' : `${Math.round(value / 60)} min`
  return value ?? 0
}

function ShopAnalyticsPage() {
  const [days, setDays] = useState(7)
  const [analytics, setAnalytics] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  const loadAnalytics = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await analyticsApi.getShopAnalytics(days)
      setAnalytics(response.data.data)
      setErrorMessage('')
    } catch (error) {
      setErrorMessage(error.response?.status === 403 ? 'You do not have permission to view shop analytics.' : error.response?.status === 404 ? 'Shop not found.' : 'Unable to load analytics.')
    } finally {
      setIsLoading(false)
    }
  }, [days])

  useEffect(() => {
    const request = window.setTimeout(loadAnalytics, 0)
    return () => window.clearTimeout(request)
  }, [loadAnalytics])

  return (
    <div className="app-shell analytics-shell">
      <div className="container analytics-container">
        <div className="analytics-topbar"><Link to="/" className="brand"><div className="brand-mark">X</div><span>XeroQ</span></Link><Link to="/shop/dashboard" className="back-link"><ArrowLeft size={16} /> Dashboard</Link></div>
        <div className="analytics-heading"><div><span className="section-tag"><BarChart3 size={15} /> Shop analytics</span><h1>Business at a glance</h1><p>Understand your shop activity using real order data.</p></div><div className="analytics-range"><label htmlFor="analytics-days">Chart range</label><select id="analytics-days" value={days} onChange={(event) => setDays(Number(event.target.value))}><option value="7">Last 7 Days</option><option value="30">Last 30 Days</option></select></div></div>
        {errorMessage && <div className="auth-error analytics-message"><AlertCircle size={18} /> {errorMessage} <button type="button" className="text-button" onClick={loadAnalytics}><RefreshCw size={14} /> Retry</button></div>}
        {isLoading ? <div className="analytics-empty dashboard-card"><LoaderCircle size={30} className="spin-icon" /><p>Loading analytics...</p></div> : !analytics?.hasShop ? <div className="analytics-empty dashboard-card"><Store size={30} /><h2>Create your shop profile to view analytics.</h2><p>Analytics will appear after customers place orders.</p></div> : <AnalyticsContent data={analytics} />}
      </div>
    </div>
  )
}

function AnalyticsContent({ data }) {
  const { summary, dailyOrders, peakHours, printTypes, priorities, paperSizes, peakHour } = data
  const totalOrders = summary.totalOrders
  const printTotal = printTypes.bwOrders + printTypes.colorOrders || 1
  const priorityTotal = priorities.normalOrders + priorities.urgentOrders || 1
  const peakMax = Math.max(...peakHours.map((item) => item.orders), 1)
  const dailyMax = Math.max(...dailyOrders.map((item) => item.orders), 1)

  return (
    <>
      {totalOrders === 0 && <div className="analytics-empty dashboard-card"><FileText size={30} /><h2>No analytics data yet.</h2><p>Analytics will appear after customers place orders.</p></div>}
      <div className="analytics-metrics">{metricCards.map(([key, label, Icon]) => <div className="analytics-metric dashboard-card" key={key}><div className="analytics-metric-icon"><Icon size={19} /></div><span>{label}</span><strong>{key === 'urgentOrders' ? summary.urgentOrders || 0 : formatMetric(key, summary[key])}</strong></div>)}</div>
      <div className="analytics-panels">
        <AnalyticsPanel title={`Orders (${data.dateRange.days === 7 ? 'Last 7 Days' : 'Last 30 Days'})`}><div className="daily-chart">{dailyOrders.map((item) => <div className="daily-column" key={item.date}><div className="daily-bar" style={{ height: `${Math.max((item.orders / dailyMax) * 100, item.orders ? 8 : 2)}%` }} title={`${item.orders} orders`} /><strong>{item.orders}</strong><small>{item.date.slice(5)}</small></div>)}</div></AnalyticsPanel>
        <AnalyticsPanel title="Peak Hours"><div className="peak-list">{peakHours.length === 0 ? <p className="muted-copy">No peak hour yet</p> : peakHours.map((item) => <div className="bar-row" key={item.hour}><span>{String(item.hour).padStart(2, '0')}:00</span><div><i style={{ width: `${(item.orders / peakMax) * 100}%` }} /></div><strong>{item.orders}</strong></div>)}</div><p className="analytics-footnote">Peak hour: {peakHour || 'No peak hour yet'}</p></AnalyticsPanel>
        <AnalyticsPanel title="Print Type Distribution"><Distribution label="B/W" value={printTypes.bwOrders} total={printTotal} /><Distribution label="Colour" value={printTypes.colorOrders} total={printTotal} /></AnalyticsPanel>
        <AnalyticsPanel title="Priority Distribution"><Distribution label="Normal" value={priorities.normalOrders} total={priorityTotal} /><Distribution label="Urgent" value={priorities.urgentOrders} total={priorityTotal} accent /></AnalyticsPanel>
        <AnalyticsPanel title="Paper Size Distribution"><div className="paper-list">{paperSizes.length === 0 ? <p className="muted-copy">No paper-size data yet</p> : paperSizes.map((item) => <div className="bar-row" key={item.paperSize}><span>{item.paperSize}</span><div><i style={{ width: `${(item.orders / Math.max(...paperSizes.map((size) => size.orders), 1)) * 100}%` }} /></div><strong>{item.orders}</strong></div>)}</div></AnalyticsPanel>
        <AnalyticsPanel title="Historical Queue Wait"><div className="historical-wait"><Clock3 size={22} /><p>{summary.averageWaitingTime === null ? 'Historical waiting-time data will be available for new orders.' : `Average Queue Wait: ${Math.round(summary.averageWaitingTime / 60)} minutes`}</p></div><small className="analytics-footnote">Measured from order creation to shop acceptance. Current dynamic queue estimates are not included.</small></AnalyticsPanel>
      </div>
    </>
  )
}

function AnalyticsPanel({ title, children }) {
  return <section className="analytics-panel dashboard-card"><div className="analytics-panel-heading"><h2>{title}</h2></div>{children}</section>
}

function Distribution({ label, value, total, accent = false }) {
  const percentage = Math.round((value / total) * 100)
  return <div className="distribution-row"><div><span>{label}</span><strong>{value} orders · {percentage}%</strong></div><div className={accent ? 'distribution-track accent' : 'distribution-track'}><i style={{ width: `${percentage}%` }} /></div></div>
}

export default ShopAnalyticsPage
