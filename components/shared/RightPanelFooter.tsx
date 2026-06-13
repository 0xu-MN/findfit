'use client'

import { Globe, Mail, MessageCircle, Send } from 'lucide-react'

const FOOTER_LINKS = [
  { label: '서비스 소개', href: '/' },
  { label: '이용약관', href: '#' },
  { label: '개인정보처리방침', href: '#' },
  { label: 'FAQ', href: '#' },
  { label: '제휴 문의', href: '#' },
]

const SOCIAL = [
  { Icon: Globe, href: '#', label: 'Website' },
  { Icon: MessageCircle, href: '#', label: 'Community' },
  { Icon: Send, href: '#', label: 'Newsletter' },
  { Icon: Mail, href: '#', label: 'Mail' },
]

export default function RightPanelFooter() {
  return (
    <footer className="w-full mt-10 pt-8 pb-6 border-t border-[#1D1C1C]/8">
      <div className="flex items-start justify-between gap-8 flex-wrap">
        {/* Brand */}
        <div className="flex flex-col gap-3 max-w-[280px]">
          <div className="flex items-center gap-2">
            <span className="text-base font-black tracking-tight">
              <span className="text-[#F77019]">Find</span>
              <span className="text-[#1D1C1C]">Fit</span>
            </span>
          </div>
          <p className="text-[10px] text-[#999] font-medium leading-relaxed">
            만들기 전에, 팔릴지 먼저 확인하세요. 모든 아이디어가 시장의 신호로 시작하는 세상.
          </p>
        </div>

        {/* Links */}
        <div className="flex flex-col gap-2">
          <span className="text-[10px] font-black text-[#1D1C1C] mb-1">서비스</span>
          {FOOTER_LINKS.map((l) => (
            <a
              key={l.label}
              href={l.href}
              className="text-[10px] font-bold text-[#666] hover:text-[#F77019] transition-colors"
            >
              {l.label}
            </a>
          ))}
        </div>

        {/* Social */}
        <div className="flex flex-col gap-2">
          <span className="text-[10px] font-black text-[#1D1C1C] mb-1">팔로우</span>
          <div className="flex items-center gap-1.5">
            {SOCIAL.map(({ Icon, href, label }) => (
              <a
                key={label}
                href={href}
                aria-label={label}
                className="w-7 h-7 rounded-full bg-[#F5F5F5] hover:bg-[#F77019] text-[#666] hover:text-white flex items-center justify-center transition-colors"
              >
                <Icon className="w-3 h-3" />
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="flex items-center justify-between gap-4 mt-6 pt-4 border-t border-[#1D1C1C]/5 text-[9px] font-bold text-[#999]">
        <span>© 2026 FindFit. All rights reserved.</span>
        <span>made with 🍊 in Seoul</span>
      </div>
    </footer>
  )
}
