# Launchpad Component Patterns

Standard patterns for building consistent UI components.

## Cards

```html
<div class="card p-4">
  <h3 class="font-medium text-surface-800">Card Title</h3>
  <p class="text-sm text-surface-500 mt-1">Card description</p>
</div>
```

## Form Inputs

```html
<label class="block text-sm font-medium text-surface-700 mb-1">
  Label
</label>
<input 
  type="text"
  class="input"
  placeholder="Placeholder"
/>
```

## Status Badges

```html
<!-- Ready/Active -->
<span class="badge-primary">Ready</span>

<!-- Complete -->
<span class="badge-success">Done</span>

<!-- Blocked/Warning -->
<span class="badge-warning">Blocked</span>

<!-- Backlog/Inactive -->
<span class="badge-neutral">Backlog</span>
```

## Buttons

```html
<!-- Primary action -->
<button class="btn-primary">Save Changes</button>

<!-- Secondary action -->
<button class="btn-secondary">Cancel</button>

<!-- Ghost/subtle action -->
<button class="btn-ghost">View Details</button>

<!-- Danger action -->
<button class="btn-danger">Delete</button>
```

## Progress Bar

```html
<div class="w-full bg-surface-200 rounded-full h-2">
  <div 
    class="bg-primary-500 h-2 rounded-full transition-all"
    :style="{ width: progress + '%' }"
  ></div>
</div>
```

## Filter Pills

```html
<div class="flex items-center gap-2">
  <button
    :class="[
      'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
      isActive 
        ? 'bg-primary-500 text-white' 
        : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
    ]"
  >
    Filter Option
  </button>
</div>
```

## View Toggle (Segmented Control)

```html
<div class="flex items-center gap-1 bg-surface-100 rounded-lg p-1">
  <button
    :class="[
      'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
      isActive 
        ? 'bg-white text-primary-500 shadow-sm' 
        : 'text-surface-500 hover:text-surface-700'
    ]"
  >
    Option A
  </button>
  <button>Option B</button>
</div>
```

## Section Header

```html
<div class="mb-6">
  <h1 class="text-2xl font-semibold text-surface-800">Page Title</h1>
  <p class="text-sm text-surface-500 mt-1">Page description</p>
</div>
```

## Empty State

```html
<div class="px-4 py-8 text-center text-surface-400 text-sm">
  No items found
</div>
```

## List Item with Actions

```html
<div class="flex items-start justify-between gap-3 px-4 py-3 hover:bg-surface-50 transition-colors">
  <div class="flex-1 min-w-0">
    <span class="font-medium text-surface-800">Item Title</span>
    <div class="text-xs text-surface-500 mt-1">Meta info</div>
  </div>
  <div class="flex items-center gap-1 shrink-0">
    <button class="text-sm text-primary-500 hover:text-primary-600 px-2 py-1">
      Edit
    </button>
    <button class="text-sm text-red-500 hover:text-red-600 px-2 py-1">
      Delete
    </button>
  </div>
</div>
```

## Mobile-Friendly Horizontal Scroll

```html
<div class="flex items-center gap-2 overflow-x-auto pb-2">
  <!-- scrollable content -->
</div>
```

## Responsive Grid

```html
<!-- 2 cols mobile, 4 cols desktop -->
<div class="grid grid-cols-2 md:grid-cols-4 gap-3">
  <div class="card p-3">...</div>
</div>
```
