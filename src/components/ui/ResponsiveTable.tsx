import { ReactNode } from 'react'

interface ResponsiveTableProps {
  children: ReactNode
  className?: string
}

export default function ResponsiveTable({ children, className = '' }: ResponsiveTableProps) {
  return (
    <div className={'overflow-x-auto -mx-4 sm:mx-0 ' + className}>
      <div className="inline-block min-w-full align-middle">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-700">
          {children}
        </table>
      </div>
    </div>
  )
}