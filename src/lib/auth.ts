import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { supabaseAdmin } from '@/lib/supabase'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null
        }

        // Check if Supabase is configured
        if (!supabaseAdmin) {
          console.error('Supabase not configured')
          return null
        }

        try {
          // Get user from Supabase
          const { data: user, error } = await supabaseAdmin
            .from('users')
            .select('*')
            .eq('username', credentials.username)
            .single()

          if (error || !user) {
            return null
          }

          // Verify password
          const passwordMatch = await bcrypt.compare(
            credentials.password,
            user.password_hash
          )

          if (!passwordMatch) {
            return null
          }

          return {
            id: user.id,
            name: user.username,
            email: user.email || '',
          }
        } catch (error) {
          console.error('Auth error:', error)
          return null
        }
      }
    })
  ],
  session: {
    strategy: 'jwt'
  },
  pages: {
    signIn: '/auth/signin'
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
      }
      return session
    }
  }
}
