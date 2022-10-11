import {
  WalletModuleFactory,
  InjectedWallet,
  Action,
  FunctionCallAction,
  WalletBehaviourFactory,
  waitFor,
} from "@near-wallet-selector/core";
import detectEthereumProvider from '@metamask/detect-provider'
import { nearWalletIcon } from "../assets/icons";
import { getNear, signIn, signOut, signAndSendTransactions, initConnection } from "./neth-lib";
export { initConnection } from "./neth-lib";

declare global {
  interface Window {
    near: any,
    ethereum: { chainId: string };
  }
}

export interface NethParams {
  useModalCover?: boolean;
  iconUrl?: string;
}

const isInstalled = async () => {
	await detectEthereumProvider()
  return !!window.ethereum;
};

const isMobile = () => {
  let check = false;
  (function (a) {
    if (
      /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(
        a,
      )
    )
      check = true;
  })(navigator.userAgent || navigator.vendor);
  return check;
};

let useCover = false;

const Neth: WalletBehaviourFactory<InjectedWallet> = async ({ metadata, logger, options }) => {
  initConnection(options.network);

  const cover = document.createElement("div");
  const coverImg = document.createElement("img");
  coverImg.src = nearWalletIcon;
  cover.className = "modal-overlay-standalone";
  cover.style.display = "none";
  cover.appendChild(coverImg);
  document.body.appendChild(cover);

  const isValidActions = (actions: Array<Action>): actions is Array<FunctionCallAction> => {
    return actions.every((x) => x.type === "FunctionCall");
  };

  const transformActions = (actions: Array<Action>) => {
    const validActions = isValidActions(actions);

    if (!validActions) {
      throw new Error(`Only 'FunctionCall' actions types are supported by ${metadata.name}`);
    }

    return actions.map((x) => x.params);
  };

  // return the wallet interface for wallet-selector
  return {
    async signIn() {
      let account;
      try {
        account = await signIn();
        if (!account) return []
      } catch (e: any) {
        if (!/not connected/.test(e.toString())) throw e;
        // console.log(e);
      }
      return [account];
    },

    async signOut() {
      await signOut();
    },

    async verifyOwner({ message }) {
      // logger.log("Sender:verifyOwner", { message });

      // const account = _state.wallet.account();

      // if (!account) {
      //   throw new Error("Wallet not signed in");
      // }

      // // Note: When the wallet is locked, Sender returns an empty Signer interface.
      // // Even after unlocking the wallet, the user will need to refresh to gain
      // // access to these methods.
      // if (!account.connection.signer.signMessage) {
      //   throw new Error("Wallet is locked");
      // }

      // const networkId = options.network.networkId;
      // const accountId = account.accountId;
      // const pubKey = await account.connection.signer.getPublicKey(
      //   accountId,
      //   networkId
      // );
      // const block = await provider.block({ finality: "final" });

      // const data = {
      //   accountId,
      //   message,
      //   blockId: block.header.hash,
      //   publicKey: Buffer.from(pubKey.data).toString("base64"),
      //   keyType: pubKey.keyType,
      // };
      // const encoded = JSON.stringify(data);

      // const signed = await account.connection.signer.signMessage(
      //   new Uint8Array(Buffer.from(encoded)),
      //   accountId,
      //   networkId
      // );

      return {
        accountId: '',
        message: '',
        blockId: '',
        publicKey: '',
        keyType: 0,
        signature: '',
      };
    },

    async getAccounts() {
      const { accountId } = await getNear();
      return [{ accountId }];
    },

    async signAndSendTransaction({ receiverId, actions }) {
      logger.log("Neth:signAndSendTransaction", {
        receiverId,
        actions,
      });

      return signAndSendTransactions({
        transactions: [
          {
            receiverId,
            actions: transformActions(actions),
          },
        ],
      });
    },

    async signAndSendTransactions({ transactions }) {
      logger.log("Neth:signAndSendTransactions", { transactions });

      if (useCover) {
        cover.style.display = "block";
      }

      const transformedTxs = transactions.map(({ receiverId, actions }) => ({
        receiverId,
        actions: transformActions(actions),
      }));

      let res;
      try {
        res = await signAndSendTransactions({
          transactions: transformedTxs,
        });
      } catch (e) {
        /// user cancelled or near network error
        console.warn(e);
      }

      if (useCover) {
        cover.style.display = "none";
      }

      return res;
    },
  };
};

export function setupNeth({
  useModalCover = false,
  iconUrl = nearWalletIcon,
}: NethParams = {}): WalletModuleFactory<InjectedWallet> {
  return async () => {
    // const mobile = isMobile();
    const installed = await isInstalled();

    useCover = useModalCover;

    if (!installed) {
      return null;
    }

    await waitFor(() => !!window.near?.isSignedIn(), { timeout: 300 }).catch(() => false);

    return {
      id: "neth",
      type: "injected",
      metadata: {
        name: "NETH Account",
        description: null,
        iconUrl,
        downloadUrl:
          "https://example.com",
        deprecated: false,
        available: true,
      },
      init: Neth,
    };
  };
}
