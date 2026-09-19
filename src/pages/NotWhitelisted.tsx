import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { useBlocoPath } from '../lib/bloco'
import { Button } from '../components/product/ui'

export default function NotWhitelisted() {
  const { signOut, session } = useAuth()
  const navigate = useNavigate()
  const blocoPath = useBlocoPath()

  async function handleSignOut() {
    await signOut()
    navigate(blocoPath('/login'), { replace: true })
  }

  return (
    <div className="min-h-full flex items-center justify-center px-6 py-12 bg-bloco-paper">
      <div className="max-w-sm text-center">
        <div className="inline-block -rotate-2 bg-bloco-red px-4 py-2 border-2 border-bloco-ink shadow-hard-sm mb-5">
          <span className="font-display text-sm text-white">CONTA NÃO AUTORIZADA</span>
        </div>
        <p className="text-bloco-ink mb-2">
          O e-mail <strong>{session?.user.email}</strong> não está na lista da bateria.
        </p>
        <p className="text-bloco-muted mb-6 text-sm">
          Fale com a direção do bloco pra pedir o cadastro, ou verifique se o e-mail
          que você usou é o mesmo que entregou no formulário de inscrição.
        </p>
        <Button onClick={handleSignOut}>SAIR</Button>
      </div>
    </div>
  )
}
