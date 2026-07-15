'use client'

import React from 'react'

interface SearchBarProps {
  searchTerm: string
  setSearchTerm: (term: string) => void
}

const SearchBar: React.FC<SearchBarProps> = ({ searchTerm, setSearchTerm }) => {
  return (
    <div className="flex flex-1 items-center pb-8 relative leading-[28px]">
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="absolute left-4 w-4 h-4 fill-gray-400 pointer-events-none z-10"
      >
        <g>
          <path d="M21.53 20.47l-3.66-3.66C19.195 15.24 20 13.214 20 11c0-4.97-4.03-9-9-9s-9 4.03-9 9 4.03 9 9 9c2.215 0 4.24-.804 5.808-2.13l3.66 3.66c.147.146.34.22.53.22s.385-.073.53-.22c.295-.293.295-.767.002-1.06zM3.5 11c0-4.135 3.365-7.5 7.5-7.5s7.5 3.365 7.5 7.5-3.365 7.5-7.5 7.5-7.5-3.365-7.5-7.5z"></path>
        </g>
      </svg>

      <input
        id="query"
        type="search"
        name="searchbar"
        placeholder="Search..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="font-montserrat w-full h-[45px] pl-10 pr-3 rounded-lg bg-[#16171d] border-0 
          text-gray-400 outline-none transition-all duration-300 ease-in-out cursor-text z-0
          shadow-[0_0_0_1.5px_#2b2c37,0_0_25px_-17px_#000]
          placeholder-gray-400
          hover:shadow-[0_0_0_2.5px_#2f303d,0_0_25px_-15px_#000]
          active:scale-[0.95]
          focus:shadow-[0_0_0_2.5px_#2f303d]"
      />
    </div>
  )
}

export default SearchBar
