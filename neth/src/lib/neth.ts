import {
  WalletModuleFactory,
  InjectedWallet,
  Action,
  FunctionCallAction,
  WalletBehaviourFactory,
  waitFor,
} from "@near-wallet-selector/core";
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

const isInstalled = () => {
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
      } catch (e: any) {
        if (!/not connected/.test(e.toString())) throw e;
        // console.log(e);
      }
      return [account];
    },

    async signOut() {
      await signOut();
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
    const mobile = isMobile();
    const installed = await isInstalled();

    useCover = useModalCover;

    if (mobile || !installed) {
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
