import React from "react"

interface PaginatorProps {
  currentPage: number,
  totalRecords: number,
  pageLimit: number,
  onPageChanged: (page: number) => void
}

class Paginator extends React.Component<PaginatorProps> {
  nextClick = (e: any) => {
    e.preventDefault()

    this.props.onPageChanged(this.props.currentPage + 1)
  }

  prevClick = (e: any) => {
    e.preventDefault()

    this.props.onPageChanged(this.props.currentPage - 1)
  }

  totalPages = () => {
    return Math.ceil(this.props.totalRecords / this.props.pageLimit)
  }

  render() {
    return (
      <nav className="paginator text-end">
        <ul className="pagination pagination-sm">
          <li className={this.props.currentPage <= 1 ? 'page-item disabled' : 'page-item'}>
            { /* eslint-disable-next-line  */}
            <a className="page-link" href="#" aria-label="Previous" onClick={this.prevClick}>
              <span aria-hidden="true">&laquo;</span>
            </a>
          </li>
          <li className={this.props.currentPage >= this.totalPages() ? 'page-item disabled' : 'page-item'}>
            { /* eslint-disable-next-line  */}
            <a className="page-link" href="#" aria-label="Next" onClick={this.nextClick}>
              <span aria-hidden="true">&raquo;</span>
            </a>
          </li>
        </ul>
      </nav>
    )
  }
}

export default Paginator
