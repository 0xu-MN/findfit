const footerLinks = [
  {
    category: '서비스',
    links: [
      { label: '크리에이터', href: '#' },
      { label: '리뷰어', href: '#reviewer' },
      { label: '이용 요금', href: '#pricing' },
    ],
  },
  {
    category: '회사',
    links: [
      { label: '소개', href: '#about' },
      { label: 'FAQ', href: '#faq' },
      { label: '문의하기', href: '#' },
    ],
  },
  {
    category: '법적 고지',
    links: [
      { label: '이용약관', href: '#' },
      { label: '개인정보처리방침', href: '/privacy' },
    ],
  },
]

export default function Footer() {
  return (
    <footer style={{ background: '#1D1C1C' }}>
      <div className="max-w-[1440px] mx-auto px-16 pt-16 pb-10">
        <div className="flex justify-between items-start mb-14">
          <div className="max-w-[280px]">
            <img src="/logo.png" alt="FindFit" className="h-11 w-auto object-contain" />
            <p className="text-white/35 text-sm leading-relaxed mt-3">
              모든 아이디어가 시장의 신호로<br />시작하는 세상을 만들어갑니다.
            </p>
          </div>

          <div className="flex gap-16">
            {footerLinks.map(({ category, links }) => (
              <div key={category}>
                <p className="text-white/30 text-[11px] font-bold uppercase tracking-[0.15em] mb-4">
                  {category}
                </p>
                <ul className="flex flex-col gap-3">
                  {links.map((link) => (
                    <li key={link.label}>
                      <a href={link.href} className="text-sm text-white/55 hover:text-white transition-colors">
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />

        <div className="flex items-center justify-between mt-8">
          <p className="text-xs text-white/25">© 2026 FindFit. All rights reserved.</p>
          <p className="text-xs text-white/20">아이디어를 검증하는 가장 빠른 방법</p>
        </div>
      </div>
    </footer>
  )
}
