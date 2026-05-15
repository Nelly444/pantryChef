import { useState } from 'react'
import { useMealPlan } from '../hooks/useMealPlan.js'
import EmptyState from './EmptyState.jsx'
import { Bowl, Leaf } from './Icons.jsx'

const CATEGORIES = [
  { id: 'produce',  label: 'Produce',  keywords: ['apple','banana','carrot','tomato','onion','garlic','pepper','lettuce','spinach','broccoli','mushroom','potato','cucumber','zucchini','lemon','lime','avocado','corn','pea','kale','cabbage','celery','asparagus','beet','parsley','cilantro','basil','mint','ginger','berry','strawberry','blueberry','grape','orange','mango','pineapple','peach','pear','cherry','scallion','leek','fennel','artichoke','chard','arugula','radish','turnip','squash','pumpkin'] },
  { id: 'protein',  label: 'Protein',  keywords: ['chicken','beef','pork','fish','salmon','tuna','shrimp','turkey','lamb','egg','tofu','tempeh','lentil','chickpea','black bean','sausage','bacon','crab','lobster','clam','mussel','anchovy','sardine','ham','veal','bison','duck','venison'] },
  { id: 'dairy',    label: 'Dairy',    keywords: ['milk','cheese','butter','cream','yogurt','sour cream','ricotta','mozzarella','parmesan','cheddar','brie','feta','gouda','goat cheese','half and half','ghee','kefir','whipped cream'] },
  { id: 'grains',   label: 'Grains',   keywords: ['rice','pasta','bread','flour','oat','quinoa','noodle','tortilla','cracker','cereal','couscous','barley','bulgur','farro','polenta','wrap','pita','bagel','muffin','roll','loaf','rye','sourdough'] },
  { id: 'pantry',   label: 'Pantry',   keywords: ['oil','vinegar','sauce','soy','salt','sugar','honey','mustard','ketchup','mayo','sriracha','cumin','turmeric','paprika','cinnamon','oregano','thyme','rosemary','bay','stock','broth','canned','paste','coconut milk','baking','yeast','cornstarch','nutmeg','cardamom','chili','curry','allspice','clove','vanilla','molasses','syrup','jam','peanut','almond','sesame'] },
]

function categorize(name) {
  const lower = name.toLowerCase()
  for (const cat of CATEGORIES) {
    if (cat.keywords.some(k => lower.includes(k))) return cat.id
  }
  return 'other'
}

export default function GroceryListView({ onNavigateHome }) {
  const { plan, DAYS, DAY_SHORT } = useMealPlan()
  const [checked, setChecked] = useState(() => {
    try { localStorage.removeItem('pantry-grocery-checked') } catch {}
    return new Set()
  })

  const toggle = (key) => {
    const next = new Set(checked)
    next.has(key) ? next.delete(key) : next.add(key)
    setChecked(next)
  }

  // Build ingredient → days map (plan is now day → mealType → result)
  const itemDays = {}
  DAYS.forEach((day, i) => {
    const daySlots = plan[day] ?? {}
    Object.values(daySlots).forEach(result => {
      if (!result) return
      ;(result.missing_ingredients ?? []).forEach(raw => {
        const key = raw.toLowerCase()
        if (!itemDays[key]) itemDays[key] = { name: raw, days: [] }
        if (!itemDays[key].days.includes(DAY_SHORT[i])) {
          itemDays[key].days.push(DAY_SHORT[i])
        }
      })
    })
  })

  const allItems = Object.values(itemDays)
  const totalNeeded = allItems.length
  const totalChecked = allItems.filter(it => checked.has(it.name.toLowerCase())).length
  const isComplete = totalNeeded > 0 && totalChecked === totalNeeded

  if (totalNeeded === 0) {
    const hasAnyPlan = DAYS.some(d => Object.values(plan[d] ?? {}).some(Boolean))
    return (
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <h2 className="font-display mb-6 text-2xl font-black italic text-bark">Grocery List</h2>
        <EmptyState
          Icon={hasAnyPlan ? Leaf : Bowl}
          title={hasAnyPlan ? "All ingredients are already in your pantry!" : "No meal plan yet."}
          message={hasAnyPlan ? "Every planned meal can be made with what you have." : "Head to the Meal Plan tab and plan your week first."}
          action={hasAnyPlan ? undefined : "Go to Home"}
          onAction={hasAnyPlan ? undefined : onNavigateHome}
        />
      </div>
    )
  }

  // Group by category
  const groups = {}
  allItems.forEach(it => {
    const cat = categorize(it.name)
    if (!groups[cat]) groups[cat] = []
    groups[cat].push(it)
  })

  const orderedGroups = [
    ...CATEGORIES.filter(c => groups[c.id]).map(c => ({ id: c.id, label: c.label, items: groups[c.id] })),
    ...(groups.other ? [{ id: 'other', label: 'Other', items: groups.other }] : []),
  ]

  const handleCopy = () => {
    const lines = orderedGroups.flatMap(g => [
      `\n${g.label.toUpperCase()}`,
      ...g.items.map(it => `${checked.has(it.name.toLowerCase()) ? '✓' : '○'} ${it.name} (${it.days.join(', ')})`),
    ])
    navigator.clipboard.writeText(lines.join('\n').trim()).catch(() => {})
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">

      {/* Header */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-black italic text-bark">Grocery List</h2>
          <p className="text-sm text-bark-light/60">
            {totalChecked} of {totalNeeded} items checked
            {isComplete && <span className="ml-2 font-bold text-forest">— All done!</span>}
          </p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={handleCopy}
            className="btn-ghost rounded-xl border border-olive/30 bg-white px-4 py-2 text-sm font-bold text-bark-light">
            Copy list
          </button>
          {!isComplete && (
            <button
              type="button"
              onClick={() => setChecked(new Set(allItems.map(it => it.name.toLowerCase())))}
              className="btn-ghost rounded-xl border border-olive/30 bg-white px-4 py-2 text-sm font-bold text-bark-light/60"
            >
              Check all
            </button>
          )}
          {totalChecked > 0 && (
            <button
              type="button"
              onClick={() => {
                const next = new Set(checked)
                allItems.forEach(it => next.delete(it.name.toLowerCase()))
                setChecked(next)
              }}
              className="btn-ghost rounded-xl border border-olive/30 bg-white px-4 py-2 text-sm font-bold text-bark-light/60"
            >
              Clear checked
            </button>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-6 h-2.5 overflow-hidden rounded-full bg-olive/20">
        <div
          className={`h-full rounded-full transition-all duration-500 ${isComplete ? 'bg-forest' : 'bg-forest/70'}`}
          style={{ width: `${totalNeeded ? (totalChecked / totalNeeded) * 100 : 0}%` }}
        />
      </div>

      {/* Completion banner */}
      {isComplete && (
        <div className="mb-6 rounded-2xl border border-forest/30 bg-forest/10 px-4 py-3 text-center">
          <p className="font-display text-lg font-bold italic text-forest">You got everything!</p>
          <p className="text-sm text-bark-light/60">Time to cook something great.</p>
        </div>
      )}

      {/* Category groups */}
      <div className="space-y-4">
        {orderedGroups.map(group => (
          <div key={group.id} className="overflow-hidden rounded-2xl border border-olive/20 bg-white shadow-sm">
            <div className="border-b border-olive/15 px-4 py-2.5">
              <p className="text-xs font-black uppercase tracking-widest text-bark-light/50">{group.label}</p>
            </div>
            <ul>
              {group.items.map((it, idx) => {
                const key = it.name.toLowerCase()
                const isChecked = checked.has(key)
                return (
                  <li
                    key={key}
                    className={`flex items-center gap-3 px-4 py-3 transition-all duration-200 ${idx !== 0 ? 'border-t border-olive/10' : ''} ${isChecked ? 'opacity-50' : 'hover:bg-cream/40'}`}
                  >
                    <button
                      type="button"
                      onClick={() => toggle(key)}
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-all duration-200 ${
                        isChecked
                          ? 'border-forest bg-forest text-white scale-105'
                          : 'border-olive/40 hover:border-forest hover:scale-110'
                      }`}
                      aria-label={`${isChecked ? 'Uncheck' : 'Check'} ${it.name}`}
                    >
                      {isChecked && <span className="check-mark text-[10px] font-black leading-none">✓</span>}
                    </button>
                    <span className={`flex-1 text-sm font-semibold capitalize text-bark transition-all duration-200 ${isChecked ? 'line-through text-bark-light/40' : ''}`}>
                      {it.name}
                    </span>
                    <span className="text-[10px] font-medium text-bark-light/40">
                      {it.days.join(' · ')}
                    </span>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </div>

    </div>
  )
}
