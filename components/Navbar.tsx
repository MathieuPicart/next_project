import Link from "next/link"
import Image from "next/image"
import AuthButtons from "./AuthButtons"

const Navbar = () => {
  return (
    <header>
      <nav>
        <Link href="/" className="logo">
          <Image src="/icons/logo.png" alt="logo" width={24} height={24} />

          <p>DevEvent</p>
        </Link>
        <ul>
          <AuthButtons />
        </ul>
      </nav>
    </header>
  )
}

export default Navbar