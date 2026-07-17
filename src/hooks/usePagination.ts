import { useState } from 'react'

interface UsePaginationProps {
  totalItems: number
  pageSize?: number
  initialPage?: number
}

export function usePagination({ totalItems, pageSize = 12, initialPage = 1 }: UsePaginationProps) {
  const [currentPage, setCurrentPage] = useState(initialPage)
  const totalPages = Math.ceil(totalItems / pageSize)

  const nextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
  }

  const prevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1))
  }

  const goToPage = (page: number) => {
    const pageNumber = Math.max(1, Math.min(page, totalPages))
    setCurrentPage(pageNumber)
  }

  const startIndex = (currentPage - 1) * pageSize
  const endIndex = Math.min(startIndex + pageSize, totalItems)

  return {
    currentPage,
    totalPages,
    pageSize,
    startIndex,
    endIndex,
    nextPage,
    prevPage,
    goToPage,
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1,
  }
}