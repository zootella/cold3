
// shadcn-vue init created utils.ts and components.json, which won't change again, even as we add more shadcn/ui components

import type {ClassValue} from 'clsx'
import {clsx} from 'clsx'
import {twMerge} from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {//class name helper shadcn components use to combine base classes with overrides pipes through clsx (conditional joining) then tailwind-merge (deduplication of conflicting utilities)
	return twMerge(clsx(inputs))
}
