import { saveToIPFS } from "../../../features/api/ipfs";
import { fireEvent, render, screen } from "@testing-library/react";
import { ProgressStatus } from "../../../features/api/types";
import {
  CreateRoundData,
  CreateRoundProvider,
  useCreateRound,
} from "../CreateRoundContext";
import { deployRoundContract } from "../../../features/api/round";
import { waitForSubgraphSyncTo } from "../../../features/api/subgraph";

const mockWallet = {
  address: "0x0",
  signer: {
    getChainId: () => {},
  },
};

jest.mock("../../../features/api/round");
jest.mock("../../../features/api/ipfs");
jest.mock("../../../features/api/subgraph");
jest.mock("../../../features/common/Auth", () => ({
  useWallet: () => mockWallet,
}));
jest.mock("wagmi");
jest.mock("@rainbow-me/rainbowkit", () => ({
  ConnectButton: jest.fn(),
}));

describe("<CreateRoundProvider />", () => {
  it("sets ipfs status to in progress when saving to ipfs", async () => {
    (saveToIPFS as jest.Mock).mockReturnValue(new Promise<any>(() => {}));

    renderWithProvider(<TestUseCreateRoundComponent />);

    const createRound = screen.getByTestId("create-round");
    fireEvent.click(createRound);

    expect(
      await screen.findByTestId(
        `storing-status-is-${ProgressStatus.IN_PROGRESS}`
      )
    );
  });

  it("sets ipfs status to complete when saving to ipfs succeeds", async () => {
    (saveToIPFS as jest.Mock).mockResolvedValue("my ipfs doc :)))");
    (deployRoundContract as jest.Mock).mockReturnValue(
      new Promise<any>(() => {})
    );

    renderWithProvider(<TestUseCreateRoundComponent />);

    const createRound = screen.getByTestId("create-round");
    fireEvent.click(createRound);

    expect(
      await screen.findByTestId(
        `storing-status-is-${ProgressStatus.IS_SUCCESS}`
      )
    );
  });

  it("sets contract deployment status to in progress when contract is being deployed", async () => {
    const ipfsHash = "bafabcdef";
    (saveToIPFS as jest.Mock).mockResolvedValue(ipfsHash);
    (deployRoundContract as jest.Mock).mockReturnValue(
      new Promise<any>(() => {})
    );

    renderWithProvider(<TestUseCreateRoundComponent />);

    const createContract = screen.getByTestId("create-round");
    fireEvent.click(createContract);

    expect(
      await screen.findByTestId(
        `deploying-status-is-${ProgressStatus.IN_PROGRESS}`
      )
    );
    const firstCall = (deployRoundContract as jest.Mock).mock.calls[0];
    const roundParameter = firstCall[0];
    const actualRoundMetadataPointer = roundParameter.store;
    expect(actualRoundMetadataPointer).toEqual({
      protocol: 1,
      pointer: ipfsHash,
    });
    const actualApplicationSchemaPointer = roundParameter.applicationStore;
    expect(actualApplicationSchemaPointer).toEqual({
      protocol: 1,
      pointer: ipfsHash,
    });
  });

  it("sets contract deployment status to success when contract has been deployed", async () => {
    (saveToIPFS as jest.Mock).mockResolvedValue("bafabcdef");
    (deployRoundContract as jest.Mock).mockResolvedValue({});

    renderWithProvider(<TestUseCreateRoundComponent />);

    const createContract = screen.getByTestId("create-round");
    fireEvent.click(createContract);

    expect(
      await screen.findByTestId(
        `deploying-status-is-${ProgressStatus.IS_SUCCESS}`
      )
    );
  });

  it("sets indexing status to in progress when waiting for subgraph to index", async () => {
    const transactionBlockNumber = 10;
    (saveToIPFS as jest.Mock).mockResolvedValue("bafabcdef");
    (deployRoundContract as jest.Mock).mockResolvedValue({
      transactionBlockNumber,
    });
    (waitForSubgraphSyncTo as jest.Mock).mockReturnValue(
      new Promise<any>(() => {})
    );

    renderWithProvider(<TestUseCreateRoundComponent />);

    const createContract = screen.getByTestId("create-round");
    fireEvent.click(createContract);

    expect(
      await screen.findByTestId(
        `indexing-status-is-${ProgressStatus.IN_PROGRESS}`
      )
    );
  });

  it("sets indexing status to completed when subgraph is finished indexing", async () => {
    const transactionBlockNumber = 10;
    (saveToIPFS as jest.Mock).mockResolvedValue("bafabcdef");
    (deployRoundContract as jest.Mock).mockResolvedValue({
      transactionBlockNumber,
    });
    (waitForSubgraphSyncTo as jest.Mock).mockResolvedValue(
      transactionBlockNumber
    );

    renderWithProvider(<TestUseCreateRoundComponent />);

    const createContract = screen.getByTestId("create-round");
    fireEvent.click(createContract);

    expect(
      await screen.findByTestId(
        `indexing-status-is-${ProgressStatus.IS_SUCCESS}`
      )
    );
  });

  describe("useCreateRound() Errors", () => {
    let consoleErrorSpy: jest.SpyInstance;

    beforeEach(() => {
      consoleErrorSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});
    });

    afterEach(() => {
      consoleErrorSpy.mockClear();
    });

    it("sets ipfs status to error when ipfs save fails", async () => {
      (saveToIPFS as jest.Mock).mockRejectedValue(new Error(":("));

      renderWithProvider(<TestUseCreateRoundComponent />);
      const createRound = screen.getByTestId("create-round");
      fireEvent.click(createRound);

      expect(
        await screen.findByTestId(
          `storing-status-is-${ProgressStatus.IS_ERROR}`
        )
      ).toBeInTheDocument();
    });

    it("sets contract deployment status to error when deployment fails", async () => {
      (saveToIPFS as jest.Mock).mockResolvedValue("asdf");
      (deployRoundContract as jest.Mock).mockRejectedValue(
        new Error("Failed to deploy :(")
      );

      renderWithProvider(<TestUseCreateRoundComponent />);
      const createRound = screen.getByTestId("create-round");
      fireEvent.click(createRound);

      expect(
        await screen.findByTestId(
          `deploying-status-is-${ProgressStatus.IS_ERROR}`
        )
      ).toBeInTheDocument();
    });

    it("sets indexing status to error when waiting for subgraph to sync fails", async () => {
      (saveToIPFS as jest.Mock).mockResolvedValue("asdf");
      (deployRoundContract as jest.Mock).mockResolvedValue({
        transactionBlockNumber: 100,
      });
      (waitForSubgraphSyncTo as jest.Mock).mockRejectedValue(new Error(":("));

      renderWithProvider(<TestUseCreateRoundComponent />);
      const createRound = screen.getByTestId("create-round");
      fireEvent.click(createRound);

      expect(
        await screen.findByTestId(
          `indexing-status-is-${ProgressStatus.IS_ERROR}`
        )
      ).toBeInTheDocument();
    });

    it("if ipfs save fails, resets ipfs status when create round is retried", async () => {
      (saveToIPFS as jest.Mock)
        .mockRejectedValueOnce(new Error(":("))
        .mockReturnValue(new Promise<any>(() => {}));

      renderWithProvider(<TestUseCreateRoundComponent />);
      fireEvent.click(screen.getByTestId("create-round"));

      await screen.findByTestId(`storing-status-is-${ProgressStatus.IS_ERROR}`);

      // retry create-round operation
      fireEvent.click(screen.getByTestId("create-round"));

      expect(
        screen.queryByTestId(`storing-status-is-${ProgressStatus.IS_ERROR}`)
      ).not.toBeInTheDocument();
    });

    it("if contract deployment fails, resets contract deployment status when create round is retried", async () => {
      (saveToIPFS as jest.Mock).mockResolvedValue("asdf");
      (deployRoundContract as jest.Mock)
        .mockRejectedValueOnce(new Error(":("))
        .mockReturnValue(new Promise<any>(() => {}));

      renderWithProvider(<TestUseCreateRoundComponent />);
      fireEvent.click(screen.getByTestId("create-round"));

      await screen.findByTestId(
        `deploying-status-is-${ProgressStatus.IS_ERROR}`
      );

      // retry create-round operation
      fireEvent.click(screen.getByTestId("create-round"));

      expect(
        screen.queryByTestId(`deploying-status-is-${ProgressStatus.IS_ERROR}`)
      ).not.toBeInTheDocument();
    });

    it("if indexing fails, resets indexing status when create round is retried", async () => {
      (saveToIPFS as jest.Mock).mockResolvedValue("asdf");
      (deployRoundContract as jest.Mock).mockResolvedValue({
        transactionBlockNumber: 100,
      });
      (waitForSubgraphSyncTo as jest.Mock)
        .mockRejectedValueOnce(new Error(":("))
        .mockReturnValue(new Promise<any>(() => {}));

      renderWithProvider(<TestUseCreateRoundComponent />);
      fireEvent.click(screen.getByTestId("create-round"));

      await screen.findByTestId(
        `indexing-status-is-${ProgressStatus.IS_ERROR}`
      );

      // retry create-round operation
      fireEvent.click(screen.getByTestId("create-round"));

      expect(
        screen.queryByTestId(`indexing-status-is-${ProgressStatus.IS_ERROR}`)
      ).not.toBeInTheDocument();
    });
  });
});

const TestUseCreateRoundComponent = () => {
  const {
    createRound,
    IPFSCurrentStatus,
    contractDeploymentStatus,
    indexingStatus,
  } = useCreateRound();

  return (
    <div>
      <button
        onClick={() => createRound({} as unknown as CreateRoundData)}
        data-testid="create-round"
      >
        Create My Program
      </button>

      <div data-testid={`storing-status-is-${IPFSCurrentStatus}`} />

      <div data-testid={`deploying-status-is-${contractDeploymentStatus}`} />

      <div data-testid={`indexing-status-is-${indexingStatus}`} />
    </div>
  );
};

function renderWithProvider(ui: JSX.Element) {
  render(<CreateRoundProvider>{ui}</CreateRoundProvider>);
}
