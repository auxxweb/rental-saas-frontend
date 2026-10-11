/**
 * Transform copied Next `app-routes` pages for React Router.
 * Run: node scripts/migrate-app-routes.cjs
 */
const fs = require('fs')
const path = require('path')

const root = path.join(__dirname, '../src/app-routes')

function walk(dir, out = []) {
  for (const name of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, name.name)
    if (name.isDirectory()) walk(p, out)
    else if (name.name.endsWith('.tsx')) out.push(p)
  }
  return out
}

function transform(content) {
  let s = content
  s = s.replace(/^'use client'\s*\n\s*\n?/m, '')

  s = s.replace(/import Link from 'next\/link'/g, "import { Link } from 'react-router-dom'")
  s = s.replace(/\bhref=/g, 'to=')

  s = s.replace(
    /import \{ useRouter, useParams \} from 'next\/navigation'/g,
    "import { useNavigate, useParams } from 'react-router-dom'"
  )
  s = s.replace(
    /import \{ useParams, useRouter \} from 'next\/navigation'/g,
    "import { useParams, useNavigate } from 'react-router-dom'"
  )
  s = s.replace(
    /import \{ useRouter, useSearchParams \} from 'next\/navigation'/g,
    "import { useNavigate, useSearchParams } from 'react-router-dom'"
  )
  s = s.replace(
    /import \{ usePathname, useRouter \} from 'next\/navigation'/g,
    "import { useLocation, useNavigate } from 'react-router-dom'"
  )
  s = s.replace(/import \{ useRouter \} from 'next\/navigation'/g, "import { useNavigate } from 'react-router-dom'")
  s = s.replace(/import \{ useParams \} from 'next\/navigation'/g, "import { useParams } from 'react-router-dom'")
  s = s.replace(
    /import \{ useSearchParams \} from 'next\/navigation'/g,
    "import { useSearchParams } from 'react-router-dom'"
  )

  s = s.replace(/\bconst router = useRouter\(\)/g, 'const navigate = useNavigate()')
  s = s.replace(/\bconst pathname = usePathname\(\)/g, 'const { pathname } = useLocation()')

  s = s.replace(/\brouter\.replace\(([^)]+)\)/g, 'navigate($1, { replace: true })')
  s = s.replace(/\brouter\.push\(([^)]+)\)/g, 'navigate($1)')

  s = s.replace(/\[([^\]]*)\brouter\b([^\]]*)\]/g, (m, a, b) => `[${a}navigate${b}]`)
  return s
}

const files = walk(root)

for (const file of files) {
  const rel = path.relative(root, file)
  if (rel === 'layout.tsx') {
    fs.unlinkSync(file)
    console.log('Removed', rel)
    continue
  }
  if (rel === path.join('tenant', 'layout.tsx')) {
    fs.writeFileSync(file, transform(fs.readFileSync(file, 'utf8')))
    console.log('Migrated', rel)
    continue
  }
  if (path.basename(file) === 'page.tsx') {
    fs.writeFileSync(file, transform(fs.readFileSync(file, 'utf8')))
    console.log('Migrated', rel)
  }
}
