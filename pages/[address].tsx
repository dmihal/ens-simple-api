import { GetServerSideProps } from 'next'
// @ts-ignore
import namehash from 'eth-ens-namehash'

export default function NullPage() {
  return null
}

async function getName(address: string) {
  const node = namehash.hash(`${address.substring(2)}.addr.reverse`)
  const rpcResponse = await fetch('https://cloudflare-eth.com/', {
    'headers': {
      'content-type': "application/json",
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'eth_call',
      id: 1,
      params: [
        {
          from: '0x0000000000000000000000000000000000000000',
          data: `0x691f3431${node.substr(2)}`,
          to: '0xa2c122be93b0074270ebee7f6b7292c7deb45047',
        },
        'latest',
      ],
    }),
    method: 'POST',
  })
  const response = await rpcResponse.json()

  if (!response.result) {
    throw new Error(response.error || 'ENS query failed')
  }

  const length = parseInt(response.result.substr(66,64), 16)
  if (length === 0) {
    return { props: {} }
  }
  const nameHex = response.result.substr(130, length * 2)
  const name = Buffer.from(nameHex,'hex').toString()
  return name
}

export const getServerSideProps: GetServerSideProps = async ({ req, res, params }) => {
  const address = params!.address as string
  const name = await getName(address)

  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization'
  )
  if (req.method == 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'PUT, POST, PATCH, DELETE, GET')
    return { props: {} }
  }

  res.setHeader('Cache-Control', 'max-age=60, s-maxage=${60 * 60}, stale-while-revalidate');

  res.statusCode = 200
  res.setHeader('Content-type', 'application/json')
  res.write(JSON.stringify({ name }))
  res.end()
  return { props: {} }
}
