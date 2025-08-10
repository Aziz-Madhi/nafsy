## /components/Footer.js:

1 | import React from 'react'
2 | import Link from 'next/link'
3 |
4 | const Footer = () => {
5 | return (
6 | <footer>
7 | {/_ <section aria-label="Site Footer" className=" bg-gray-900 text-white flex flex-col md:flex-row py-3 justify-center items-center">
8 | <p className="text-xs text-gray-300 pb-2">
9 | This site is using the NextJS Featured template
10 | </p>
11 | <Link className='flex flex-row items-center md:ml-3 bg-white rounded-lg px-2 py-1 w-auto hover:scale-110 transition-all duration-500' target='_blank' href="https://github.com/lifeofsoumya/NextJS-featuredStarterTemplate">
12 | <img className='w-6 mr-1' src="/svg/nextjs.svg"/>
13 | <h6 className='text-gray-700 font-semibold'>Use NextJS</h6>
14 | </Link>
15 | </section>
16 | <section aria-label="Site Footer" className=" bg-gray-900 text-white">
17 | <div className="max-w-screen-xl px-4 py-16 mx-auto space-y-8 sm:px-6 lg:space-y-16 lg:px-8">
18 | <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
19 | <div>
20 | <div className="text-teal-600">
21 | <img src='/images/logo-min.png' className='w-40' alt='typefinance logo'/>
22 | </div>
23 | <p className="max-w-xs mt-4 text-gray-500">
24 | Get started with your NextJS project right away.
25 | </p>
26 | <ul className="flex gap-6 mt-8">
27 | <li>
28 | <Link href="https://www.facebook.com/profile.php?id=100090952518947" rel="noreferrer" target="_blank" className="transition hover:opacity-75">
29 | <span className="sr-only">Facebook</span>
30 | <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
31 | <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
32 | </svg>
33 | </Link>
34 | </li>
35 | <li>
36 | <Link href="https://instagram.com/typefinance" rel="noreferrer" target="_blank" className="transition hover:opacity-75">
37 | <span className="sr-only">Instagram</span>
38 | <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
39 | <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
40 | </svg>
41 | </Link>
42 | </li>
43 | <li>
44 | <Link href="https://twitter.com/typefinance" rel="noreferrer" target="_blank" className="transition hover:opacity-75">
45 | <span className="sr-only">Twitter</span>
46 | <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
47 | <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
48 | </svg>
49 | </Link>
50 | </li>
51 | <li>
52 | <Link href="https://github.com/typefinance" rel="noreferrer" target="_blank" className="transition hover:opacity-75">
53 | <span className="sr-only">GitHub</span>
54 | <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
55 | <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
56 | </svg>
57 | </Link>
58 | </li>
59 | <li>
60 | <Link href="https://www.youtube.com/@typefinance" rel="noreferrer" target="_blank" className=" transition hover:opacity-75">
61 | <span className="sr-only">Youtube</span>
62 | <svg xmlns="http://www.w3.org/2000/svg"  className="w-6 h-6" viewBox="0 0 24 24" fill="#000" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"/><path d="m9.75 15.02 5.75-3.27-5.75-3.27v6.54z"/></svg>
63 | </Link>
64 | </li>
65 | </ul>
66 | </div>
67 | <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:col-span-2 lg:grid-cols-4">
68 | <div>
69 | <p className="font-medium">Services</p>
70 | <nav aria-label="Footer Navigation - Services" className="mt-6">
71 | <ul className="space-y-4 text-sm">
72 | <li>
73 | <Link href="/asseteer" className="text-gray-300 transition hover:opacity-75">
74 | Asseteer Tool
75 | </Link>
76 | </li>
77 | <li>
78 | <Link href="/sip-calculator" className="text-gray-300 transition hover:opacity-75">
79 | SIP Calculator
80 | </Link>
81 | </li>
82 | </ul>
83 | </nav>
84 | </div>
85 | <div>
86 | <p className="font-medium ">Company</p>
87 | <nav aria-label="Footer Navigation - Company" className="mt-6">
88 | <ul className="space-y-4 text-sm">
89 | <li>
90 | <Link href="/about" className="text-gray-300 transition hover:opacity-75">
91 | About
92 | </Link>
93 | </li>
94 | </ul>
95 | </nav>
96 | </div>
97 | <div>
98 | <p className="font-medium ">Helpful Links</p>
99 | <nav aria-label="Footer Navigation - Company" className="mt-6">
100 | <ul className="space-y-4 text-sm">
101 | <li>
102 | <Link href="/contact" className="text-gray-300 transition hover:opacity-75">
103 | Contact
104 | </Link>
105 | </li>
106 | <li>
107 | <Link href="/blog" className="text-gray-300 transition hover:opacity-75">
108 | Blog
109 | </Link>
110 | </li>
111 | </ul>
112 | </nav>
113 | </div>
114 | <div>
115 | <p className="font-medium ">Legal</p>
116 | <nav aria-label="Footer Navigation - Legal" className="mt-6">
117 | <ul className="space-y-4 text-sm">
118 | <li>
119 | <Link href="/disclaimer" className="text-gray-300 transition hover:opacity-75">
120 | Disclaimer
121 | </Link>
122 | </li>
123 | <li>
124 | <Link href="/privacy-policy" className="text-gray-300 transition hover:opacity-75">
125 | Privacy Policy
126 | </Link>
127 | </li>
128 | <li>
129 | <Link href="/terms" className="text-gray-300 transition hover:opacity-75">
130 | Terms and conditions
131 | </Link>
132 | </li>
133 | </ul>
134 | </nav>
135 | </div>
136 | </div>
137 | </div>
138 | <p className="text-xs text-gray-500">
139 | NextJS template created with ❤️ by <Link href="https://soumyamondal.com" className="text-gray-500 transition hover:opacity-75">Soumya Mondal</Link>
140 | </p>
141 | </div>
142 | </section> _/}
143 | </footer>
144 | )
145 | }
146 |
147 | export default Footer

---

## /components/HeatmapCalender.js:

1 | import Link from 'next/link';
2 | import React from 'react'
3 |
4 | const HeatmapCalender = ({startDate, endDate, dataValues}) => {
5 | let startingDate = new Date(startDate)
6 | let endingDate = new Date(endDate);
7 | const daysInMonth = Math.ceil((endingDate - startingDate) / (1000 _ 60 _ 60 _ 24)) + 1;
8 | const calenderGrid = Array.from({ length: daysInMonth }, (\_, i) => {
9 | const date = new Date(startingDate);
10 | date.setDate(startingDate.getDate() + i)
11 | return date.toISOString().slice(0, 10);
12 | })
13 |
14 | const highestValue = dataValues?.reduce((a, b)=> Math.max(a, b.count), -Infinity)
15 |
16 | const getIntensity = (activityCount) => {
17 | return highestValue !== 0 ? Number(activityCount / highestValue) : 0;
18 | }
19 | const getColorFromIntensity = (intensity) => {
20 | const colorCodes = ['#FFEEEE', '#FFCCCC', '#FFAAAA', '#FF8888', '#FF6666', '#FF4444'];
21 | const colorIndex = Math.min(Math.floor((intensity _ colorCodes.length)), colorCodes.length - 1)
22 | // console.log(colorIndex, ' color index here')
23 | return colorCodes[colorIndex]
24 | }
25 | return (
26 | <div className='grid grid-flow-col gap-1' style={{gridTemplateRows: 'repeat(7, minmax(0, 1fr)'}}>
27 | {
28 | calenderGrid.map((day, index)=>{
29 | const activityCount = dataValues.find(item => item.date === day)?.count || 0;
30 | const intensity = getIntensity(activityCount);
31 | const color = getColorFromIntensity(intensity)
32 | return <Link href={`/posts?date=${day}`} className='w-4 h-4 rounded cursor-pointer bg-gray-400' title={`${activityCount} Posts on ${day}`} style={{backgroundColor: `${activityCount == 0 ? "#ffffff10" : String(color)}`}}></Link>
33 | })
34 | }
35 | </div>
36 | )
37 | }
38 |
39 | export default HeatmapCalender

---

## /components/Modal.js:

1 | import { useState, useEffect } from "react";
2 | // import '../styles/modal.css'
3 |
4 | const Modal = ({ modalTitle, videoId }) => {
5 | const [toggle, setToggle] = useState(false);
6 | const toggleModal = () => {
7 | setToggle(!toggle);
8 | };
9 | const [sizing, setSizing] = useState({
10 | w: 190,
11 | h: 0
12 | });
13 |
14 | useEffect(() => {
15 | setSizing({
16 | w:
17 | window.innerWidth > 640
18 | ? window.innerWidth / 1.8
19 | : window.innerWidth / 1.4,
20 | h:
21 | window.innerHeight > 640
22 | ? window.innerHeight _ 0.4
23 | : window.innerHeight _ 0.4
24 | });
25 | }, []);
26 | return (
27 | <>
28 | <button className="btn popup_pointer" onClick={toggleModal}>
29 | {modalTitle}
30 | </button>
31 | {toggle ? (
32 | <div>
33 | <div className="overlay" onClick={toggleModal}></div>
34 | <div className="modal_content">
35 | <iframe
36 | width={sizing.w}
37 | height={sizing.h}
38 | style={{borderRadius: '8px'}}
39 | src={`https://www.youtube.com/embed/${videoId}`}
40 | title={modalTitle}
41 | frameborder="0"
42 | allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
43 | allowfullscreen
44 | ></iframe>
45 | <button onClick={toggleModal} className="close_modal">
46 | X
47 | </button>
48 | </div>
49 | </div>
50 | ) : null}
51 | </>
52 | );
53 | };
54 |
55 | export default Modal;
56 |

---

## /components/MyHead.js:

1 | import Head from 'next/head'
2 |
3 | export default function MyHead({ title, description, image, url }) {
4 | return (
5 | <Head>
6 | <title>{`${title} | My Site`}</title>
7 | <meta name="description" content={description} />
8 | <meta property="og:title" content={title} key="title" />
9 | <meta property="og:description" content={description} key="description" />
10 | <meta property="og:image" content={image} key="image" />
11 | <meta property="og:url" content={url} key="url" />
12 | <link rel="icon" href="/images/favicon.ico" />
13 |
14 | <meta name="twitter:title" content={title} />
15 | <meta name="twitter:description" content={description} />
16 | <meta name="twitter:image" content={image} />
17 | <meta name="twitter:card" content="summary_large_image" />
18 | </Head>
19 | )
20 | }

---

## /components/Navbar.js:

1 | import Link from 'next/link'
2 | import { useRouter } from 'next/router'
3 | import { useEffect, useState } from "react";
4 |
5 | const NavBar = () => {
6 | const router = useRouter()
7 | const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
8 |
9 | const toggleMobileMenu = () => {
10 | setMobileMenuOpen(!mobileMenuOpen);
11 | };
12 | useEffect(()=>{
13 | setMobileMenuOpen(false);
14 | }, [router.asPath])
15 |
16 | return (
17 | <>  
18 | {/_ <nav className="bg-white border-gray-200 dark:bg-gray-900">
19 | <div className="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto p-4">
20 | <Link href="/" className="flex items-center">
21 | <img src="/images/favicon.ico" className="h-8 mr-3" alt="Company Logo" />
22 | <span className="self-center text-xl font-semibold whitespace-nowrap dark:text-white">Template</span>
23 | </Link>
24 | <button onClick={toggleMobileMenu} data-collapse-toggle="navbar-default" type="button" className="inline-flex items-center p-2 ml-3 text-sm text-gray-500 rounded-lg md:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600" aria-controls="navbar-default" aria-expanded="false">
25 | <span className="sr-only">Open main menu</span>
26 | <svg className="w-6 h-6" aria-hidden="true" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd"></path></svg>
27 | </button>
28 | <div className={`${mobileMenuOpen ? "" : "hidden"} w-full md:block md:w-auto focus:outline-none`} id="navbar-default">
29 | <ul className="font-medium flex flex-col p-4 md:p-0 mt-4 border border-gray-100 rounded-lg bg-gray-50 md:flex-row md:space-x-8 md:mt-0 md:border-0 md:bg-white dark:bg-gray-800 md:dark:bg-gray-900 dark:border-gray-700">
30 | <li>
31 | <Link href="/" className="block py-2 pl-3 pr-4 text-white bg-blue-700 rounded md:bg-transparent md:text-blue-700 md:p-0 dark:text-white md:dark:text-blue-500" aria-current="page">Home</Link>
32 | </li>
33 | <li>
34 | <Link href="/apply" className="block py-2 pl-3 pr-4 text-gray-900 rounded hover:bg-gray-100 md:hover:bg-transparent md:border-0 md:hover:text-blue-700 md:p-0 dark:text-white md:dark:hover:text-blue-500 dark:hover:bg-gray-700 dark:hover:text-white md:dark:hover:bg-transparent">Apply</Link>
35 | </li>
36 | <li>
37 | <Link href="/features" className="block py-2 pl-3 pr-4 text-gray-900 rounded hover:bg-gray-100 md:hover:bg-transparent md:border-0 md:hover:text-blue-700 md:p-0 dark:text-white md:dark:hover:text-blue-500 dark:hover:bg-gray-700 dark:hover:text-white md:dark:hover:bg-transparent">Features</Link>
38 | </li>
39 | <li>
40 | <Link href="#" className="block py-2 pl-3 pr-4 text-gray-900 rounded hover:bg-gray-100 md:hover:bg-transparent md:border-0 md:hover:text-blue-700 md:p-0 dark:text-white md:dark:hover:text-blue-500 dark:hover:bg-gray-700 dark:hover:text-white md:dark:hover:bg-transparent">Custom</Link>
41 | </li>
42 | <li>
43 | <Link href="#" className="block py-2 pl-3 pr-4 text-gray-900 rounded hover:bg-gray-100 md:hover:bg-transparent md:border-0 md:hover:text-blue-700 md:p-0 dark:text-white md:dark:hover:text-blue-500 dark:hover:bg-gray-700 dark:hover:text-white md:dark:hover:bg-transparent">Contact</Link>
44 | </li>
45 | </ul>
46 | </div>
47 | </div>
48 | </nav> _/}
49 | </>
50 | )
51 | }
52 |
53 | export default NavBar

---

## /components/Pagination.js:

1 | import React from 'react';
2 |
3 | const Pagination = ({ currentPage, setCurrentPage, totalPages }) => {
4 | const renderPageNumbers = () => {
5 | const pageNumbers = [];
6 | for (let i = 1; i <= totalPages; i++) {
7 | pageNumbers.push(
8 | <span
9 | key={i}
10 | className={`cursor-pointer select-none px-3 py-1 mx-2 rounded-md text-white ${
11 |                 currentPage === i ? 'bg-indigo-500' : 'bg-black'
12 |             }`}
13 | onClick={() => setCurrentPage(i)}
14 | >
15 | {i}
16 | </span>
17 | );
18 | }
19 | return pageNumbers;
20 | };
21 |
22 | return (
23 | <div className="pagination fixed bottom-10 flex justify-center w-full">
24 | <button
25 | disabled={currentPage <= 1}
26 | className={`cursor-pointer select-none px-3 py-1 mx-2 rounded-md text-white ${
27 |                 currentPage <= 1 ? 'bg-gray-300 cursor-not-allowed' : 'bg-black'
28 |             }`}
29 | onClick={() => setCurrentPage((prevPage) => prevPage - 1)}
30 | >
31 | {'<'}
32 | </button>
33 |
34 |
35 | {renderPageNumbers()}
36 |
37 | <button
38 | disabled={currentPage >= totalPages}
39 | className={`cursor-pointer select-none px-3 py-1 mx-2 rounded-md text-white ${
40 |             currentPage >= totalPages ? 'bg-gray-300 cursor-not-allowed' : 'bg-black'
41 |         }`}
42 | onClick={() => setCurrentPage((prevPage) => prevPage + 1)}
43 | >
44 | {'>'}
45 | </button>
46 | </div>
47 | );
48 | };
49 |
50 | export default Pagination;
51 |

---

## /components/Skelekit.js:

1 | import React from 'react'
2 | import styles from '../styles/skelekit.module.css'
3 |
4 | const Skelekit = ({ count = 10, height = '20px', width= '200px', backgroundColor= 'black', border= '0', borderRadius = '4px', marginBottom = '2px'}) => {
5 | const style = {
6 | height,
7 | width,
8 | borderRadius,
9 | border,
10 | backgroundColor,
11 | marginBottom,
12 | }
13 |
14 | const skeletonElement = Array(count).fill(<div style={{...style}} className={styles.skelekit}></div>)
15 | return (
16 | <>
17 | {skeletonElement}
18 | </>
19 | )
20 | }
21 |
22 | export default Skelekit

---

## /components/Slider.js:

1 | import React from 'react'
2 |
3 | const Slider = () => {
4 | return (
5 | <div>
6 | <div className="slider">
7 | <div className="slides">
8 | <div id="slide-1"><img src="https://picsum.photos/300/300" /></div>
9 | <div id="slide-2"><img src="https://picsum.photos/301/301" /></div>
10 | <div id="slide-3"><img src="https://picsum.photos/302/302" /></div>
11 | <div id="slide-4"><img src="https://picsum.photos/303/303" /></div>
12 | <div id="slide-5"><img src="https://picsum.photos/304/304" /></div>
13 | <div id="slide-6"><img src="https://picsum.photos/306/305" /></div>
14 | </div>
15 | <span className="scroll_to">
16 | <a href="#slide-1">1</a>
17 | <a href="#slide-2">2</a>
18 | <a href="#slide-3">3</a>
19 | <a href="#slide-4">4</a>
20 | <a href="#slide-5">5</a>
21 | <a href="#slide-6">6</a>
22 | </span>
23 | </div>
24 | </div>
25 | )
26 | }
27 |
28 | export default Slider

---

## /components/lottie/LottieComponent.js:

1 | import React, { useRef } from 'react'
2 | import animationJson from './animation.json'
3 | import Lottie, { useLottie, useLottieInteractivity } from 'lottie-react'
4 |
5 | const LottieComponent = () => {
6 | const ref = useRef(null)
7 | return (
8 | <div>
9 | <Lottie animationData={animationJson} onComplete={()=> {ref.current?.setDirection(-1); ref.current?.play()}} className="w-48" lottieRef={ref} loop={false} autoPlay={true} />
10 | </div>
11 | )
12 | }
13 |
14 | const InteractiveLottie = () => {
15 | const options = {
16 | animationData: animationJson
17 | }
18 | const style= {
19 | height: 350,
20 | }
21 | const lottieObject = useLottie(options, style)
22 | // {console.log(lottieObject, ' lottie Obeject')}
23 |
24 | const animation = useLottieInteractivity({
25 | lottieObj: lottieObject,
26 | actions: [{
27 | visibility: [0.1, 0.8],
28 | type: "seek",
29 | frames: [0, 150]
30 | }],
31 | mode: "scroll"
32 | })
33 |
34 | return animation
35 | }
36 |
37 | export { LottieComponent, InteractiveLottie}
