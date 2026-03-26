import {wevmDynamicImport, originApex} from 'icarus'

//owns the wagmi lifecycle: dynamic import, config, connection watching, reconnect
//persists for the lifetime of the tab — components and other stores share one wagmi instance
//client-only — load is called from onMounted, never during SSR

export const useWagmiStore = defineStore('wagmiStore', () => {

//connection state — updated by watchConnection and after reconnect
//these are live browser state from wagmi, not database state from credential_table
const connectedAddress = ref(null)//wallet address currently connected via wagmi, or null
const isConnected = ref(false)//true if a wallet is currently connected via wagmi

let _config = null//wagmi config; created once in load, holds chain/transport/connector setup
let _modules = null//dynamically imported {viem, viem_chains, wagmi_core, wagmi_connectors}
let _loaded = false

//idempotent — first caller does the dynamic import, config, and reconnect; subsequent callers are a no-op
//called from onMounted in any component that needs wagmi (WalletPanel, PriceDemo, etc.)
async function load() { if (_loaded) return; _loaded = true
	_modules = await wevmDynamicImport()
	let {viem, viem_chains, wagmi_core, wagmi_connectors} = _modules
	_config = wagmi_core.createConfig({//configure wagmi to use a wallet injected into the page and also WalletConnect
		chains: [
			viem_chains.mainnet,//choose Ethereum network with real $ETH, rather than a testnet or L2
		],
		transports: {
			[viem_chains.mainnet.id]: viem.http(Key('alchemy url, public')),//we use Alchemy to reach the blockchain; web3 keys like this are necessarily client side; configured origin protection on the dashboard
		},
		connectors: [
			wagmi_connectors.injected(),//use (1) browser wallet like MetaMask that injected window.ethereum
			wagmi_connectors.walletConnect({//and (2) WalletConnect with the relay server, QR code, and user's mobile app
				projectId: Key('walletconnect project id, public'),//got this from the reown dashboard
				showQrModal: false,//false to prevent wagmi from showing its own modal ui; we'll render the QR code
				metadata: {
					name: Key('domain, public'),
					description: Key('domain, public'),//text that shows up in the user's mobile wallet app
					url: originApex(),
				},
			}),
		],
	})
	wagmi_core.watchConnection(_config, {
		onChange(account) {
			connectedAddress.value = account.address ?? null
			isConnected.value = account.isConnected
		}
	})
	await wagmi_core.reconnect(_config)//wagmi keeps notes about this in localStorage @wagmi/core.store
	let account = wagmi_core.getConnection(_config)
	connectedAddress.value = account.address ?? null
	isConnected.value = account.isConnected//this block of wagmi api calls should not throw; if it does we want the exception to crash the page
}

//connection methods — thin wrappers over wagmi_core; errors propagate to the calling component
//which handles them as user-facing messages (ProviderNotFoundError, UserRejectedRequestError, etc.)
//callers use the returned address for logic; watchConnection separately updates the reactive refs for display
async function connectInjected() {
	let {wagmi_core, wagmi_connectors} = _modules
	let result = await wagmi_core.connect(_config, {connector: wagmi_connectors.injected()})
	return result.accounts[0]//return the connected address directly; don't rely on watchConnection having fired yet
}

async function connectWalletConnect({onDisplayUri}) {
	let {wagmi_core} = _modules
	let connectors = wagmi_core.getConnectors(_config)
	let connector = connectors.find(c => c.id == 'walletConnect')
	let provider = await connector.getProvider()
	provider.on('display_uri', onDisplayUri)
	let result = await wagmi_core.connect(_config, {connector})
	return result.accounts[0]//return the connected address directly; don't rely on watchConnection having fired yet
}

async function disconnect() {
	let {wagmi_core} = _modules
	await wagmi_core.disconnect(_config)
}

//signing — used by WalletPanel during the prove flow; contacts the local wallet or sends
//the request to the phone app via the WalletConnect relay; throws on user decline or timeout
async function signMessage({message}) {
	let {wagmi_core} = _modules
	return await wagmi_core.signMessage(_config, {message})
}

//read-only chain queries — not credential-related; used by PriceDemo to show ETH price and block number
//these go through our Alchemy transport configured above
async function getBlockNumber() {
	let {wagmi_core} = _modules
	return await wagmi_core.getBlockNumber(_config)
}

async function readContract(args) {
	let {wagmi_core} = _modules
	return await wagmi_core.readContract(_config, args)
}

return {
	connectedAddress,
	isConnected,
	load,
	connectInjected,
	connectWalletConnect,
	disconnect,
	signMessage,
	getBlockNumber,
	readContract,
}

})
