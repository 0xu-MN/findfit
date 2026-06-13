'use client'

import { useState } from 'react'
import { ArrowRight, Bookmark, Clock, User } from 'lucide-react'

const heroPost = {
  category: '성공사례',
  categoryColor: '#F77019',
  title: 'PSF 검증으로 출시 3개월 만에 월 매출 1억을 달성한 브랜드 이야기',
  desc: '단백질 쉐이크 스타트업 NutriFit이 FindFit 리뷰어 425명의 솔직한 피드백을 통해 제품을 다듬고, 타깃 고객을 정확히 찾아내기까지의 여정을 공유합니다. 검증 데이터가 어떻게 투자 유치로 이어졌는지도 함께 담겨 있습니다.',
  author: '김준혁',
  date: '2026.06.10',
  readTime: '8분',
  img: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?auto=format&fit=crop&w=900&q=80',
}

const FILTER_TABS = ['전체', '성공사례', '팁/노하우', '리뷰어 이야기', '트렌드']

const feedPosts = [
  {
    id: 1,
    category: '팁/노하우',
    categoryColor: '#8B5CF6',
    title: '검증 설문지를 잘 쓰면 리포트 품질이 2배 올라갑니다',
    desc: '막연한 "좋아요/싫어요" 대신 행동 기반 질문으로 구성하는 법을 단계별로 설명합니다.',
    author: '이서연',
    date: '2026.06.09',
    readTime: '5분',
    img: 'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 2,
    category: '트렌드',
    categoryColor: '#1565C0',
    title: '2026년 상반기 국내 소비재 PMF 트렌드 분석',
    desc: '헬스·뷰티·식품 카테고리에서 가장 빠르게 성장한 제품들의 공통점을 분석했습니다.',
    author: 'FindFit 리서치팀',
    date: '2026.06.07',
    readTime: '10분',
    img: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 3,
    category: '리뷰어 이야기',
    categoryColor: '#2E7D32',
    title: '6개월간 47개 제품을 리뷰한 마스터 핏 리뷰어의 솔직 후기',
    desc: '어떤 제품이 기억에 남고, 크리에이터에게 바라는 점은 무엇인지 인터뷰 형식으로 담았습니다.',
    author: '박민준',
    date: '2026.06.05',
    readTime: '6분',
    img: 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 4,
    category: '성공사례',
    categoryColor: '#F77019',
    title: '비건 간식 브랜드가 타깃 수정으로 전환율을 3배 높인 방법',
    desc: '처음엔 20대를 노렸지만, 검증 데이터가 30대 직장 여성이 핵심임을 알려줬습니다.',
    author: '최다은',
    date: '2026.06.03',
    readTime: '7분',
    img: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 5,
    category: '팁/노하우',
    categoryColor: '#8B5CF6',
    title: '리뷰어 사례금, 얼마가 적당할까? 카테고리별 가이드',
    desc: '식품·뷰티·IT 기기·반려동물 등 카테고리에 따라 달라지는 적정 인센티브 기준을 공개합니다.',
    author: 'FindFit 운영팀',
    date: '2026.06.01',
    readTime: '4분',
    img: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 6,
    category: '트렌드',
    categoryColor: '#1565C0',
    title: '홈트레이닝 기구, 포화 시장에서 살아남는 차별화 포인트',
    desc: '검증 데이터 2,000건을 분석해보니 "무소음"과 "공간 절약"이 결정적 구매 요인이었습니다.',
    author: '정하준',
    date: '2026.05.28',
    readTime: '6분',
    img: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=600&q=80',
  },
]

const newsItems = [
  {
    id: 1,
    tag: '공지',
    tagColor: '#F77019',
    title: 'FindFit 리뷰어 10만 명 돌파 기념 이벤트 안내',
    desc: '6월 한 달간 참여 리뷰어 전원에게 보너스 FC 지급',
    date: '2026.06.11',
  },
  {
    id: 2,
    tag: '업데이트',
    tagColor: '#1565C0',
    title: 'AI 리포트 엔진 v2.0 업데이트: 감성 분석 추가',
    desc: '긍정/부정 감성 분류와 키워드 클러스터링이 자동화됩니다.',
    date: '2026.06.08',
  },
  {
    id: 3,
    tag: '이벤트',
    tagColor: '#8B5CF6',
    title: '6월 의뢰 등록 크리에이터 대상 수수료 50% 할인',
    desc: '이번 달 신규 등록 의뢰 한정, 플랫폼 수수료 혜택 제공',
    date: '2026.06.06',
  },
  {
    id: 4,
    tag: '인사이트',
    tagColor: '#2E7D32',
    title: '리뷰어가 가장 선호하는 제품 카테고리 TOP 5',
    desc: '식품·뷰티·헬스케어·반려동물·IT 기기 순으로 참여율이 높습니다.',
    date: '2026.06.04',
  },
  {
    id: 5,
    tag: '공지',
    tagColor: '#F77019',
    title: '새로운 EXP 등급 시스템 도입 예정 안내',
    desc: 'Seed → Sprout → Builder → Launcher 순의 크리에이터 레벨 공개',
    date: '2026.06.02',
  },
]

export default function SharedFeedPanel() {
  const [activeFilter, setActiveFilter] = useState('전체')

  const filtered = activeFilter === '전체'
    ? feedPosts
    : feedPosts.filter(p => p.category === activeFilter)

  return (
    <div className="w-full min-h-full flex flex-col select-none text-[#1D1C1C]">

      {/* ── Hero Article (좌: 썸네일, 우: 텍스트) ── */}
      <div className="pb-8 border-b border-[#1D1C1C]/6">
        <div className="flex items-start gap-7">
          {/* 좌: 썸네일 (고정 높이) */}
          <div className="flex-shrink-0 rounded-2xl overflow-hidden bg-[#F0F0F2]" style={{ width: '40%', height: 200 }}>
            <img src={heroPost.img} alt={heroPost.title} className="w-full h-full object-cover" />
          </div>
          {/* 우: 텍스트 */}
          <div className="flex-1 min-w-0 flex flex-col justify-center gap-3.5">
            <h1 className="font-black text-[#1D1C1C] leading-snug" style={{ fontSize: 'clamp(18px,2vw,26px)' }}>
              {heroPost.title}
            </h1>
            <p className="text-[12px] text-[#666] leading-relaxed">
              {heroPost.desc}
            </p>
            <div className="flex items-center gap-4 text-[10px] text-[#999] font-medium">
              <span className="flex items-center gap-1"><User className="w-3 h-3" />{heroPost.author}</span>
              <span>{heroPost.date}</span>
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" />읽기 {heroPost.readTime}</span>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap mt-1">
              {[heroPost.category, '검증', 'PSF', '성장'].map(tag => (
                <span key={tag} className="text-[9px] font-bold px-2.5 py-1 rounded-full border border-[#1D1C1C]/10 text-[#666]">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Content + Sidebar ── */}
      <div className="flex gap-8 pt-7 pb-10">

        {/* ── Left: Latest Posts ── */}
        <div className="flex-1 min-w-0 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h2 className="text-[15px] font-black text-[#1D1C1C]">최신 피드</h2>
          </div>

          {/* Filter tabs */}
          <div className="flex items-center gap-2 flex-wrap">
            {FILTER_TABS.map(tab => (
              <button key={tab} onClick={() => setActiveFilter(tab)}
                className="text-[10px] font-bold px-3 py-1.5 rounded-full border transition-all"
                style={activeFilter === tab
                  ? { background: '#F77019', color: '#fff', borderColor: '#F77019' }
                  : { background: '#fff', color: '#666', borderColor: 'rgba(29,28,28,0.1)' }
                }>
                {tab}
              </button>
            ))}
          </div>

          {/* Card grid — 가로 3개 고정 */}
          <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
            {filtered.map(post => (
              <FeedCard key={post.id} post={post} />
            ))}
          </div>
        </div>

        {/* ── Right: Newsroom sidebar ── */}
        <div className="flex-shrink-0 flex flex-col gap-4" style={{ width: 220 }}>
          <h2 className="text-[13px] font-black text-[#1D1C1C]">파인드핏 뉴스룸</h2>
          <div className="flex flex-col gap-3">
            {newsItems.map(item => (
              <NewsItem key={item.id} item={item} />
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}

function FeedCard({ post }: { post: typeof feedPosts[0] }) {
  return (
    <article className="flex flex-col gap-3 group cursor-pointer">
      <div className="w-full rounded-2xl overflow-hidden bg-[#F0F0F2]" style={{ aspectRatio: '4 / 3' }}>
        <img src={post.img} alt={post.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-black px-2 py-0.5 rounded-md"
            style={{ color: post.categoryColor, background: `${post.categoryColor}12`, border: `1px solid ${post.categoryColor}20` }}>
            {post.category}
          </span>
          <span className="text-[9px] text-[#BBB] font-medium">{post.date}</span>
        </div>
        <h3 className="text-[12px] font-black text-[#1D1C1C] leading-snug line-clamp-2 group-hover:text-[#F77019] transition-colors">
          {post.title}
        </h3>
        <p className="text-[10px] text-[#888] leading-relaxed line-clamp-2">{post.desc}</p>
        <div className="flex items-center justify-between mt-1">
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded-full bg-[#1D1C1C]/10 flex items-center justify-center text-[8px] font-black text-[#666]">
              {post.author[0]}
            </div>
            <span className="text-[9px] text-[#999] font-medium">{post.author}</span>
          </div>
          <span className="text-[9px] text-[#BBB] font-medium flex items-center gap-0.5">
            <Clock className="w-2.5 h-2.5" />{post.readTime}
          </span>
        </div>
      </div>
    </article>
  )
}

function NewsItem({ item }: { item: typeof newsItems[0] }) {
  return (
    <div className="flex flex-col gap-1.5 pb-3 border-b border-[#1D1C1C]/5 last:border-0 cursor-pointer group">
      <div className="flex items-center gap-1.5">
        <span className="text-[8px] font-black px-1.5 py-0.5 rounded"
          style={{ color: item.tagColor, background: `${item.tagColor}12` }}>
          {item.tag}
        </span>
        <span className="text-[9px] text-[#BBB] font-medium">{item.date}</span>
      </div>
      <p className="text-[11px] font-black text-[#1D1C1C] leading-snug group-hover:text-[#F77019] transition-colors line-clamp-2">
        {item.title}
      </p>
      <p className="text-[9px] text-[#999] leading-relaxed line-clamp-2">{item.desc}</p>
    </div>
  )
}
