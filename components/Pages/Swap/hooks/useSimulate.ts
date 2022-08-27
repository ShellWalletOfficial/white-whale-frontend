import { useMemo } from "react";
import { useQuery } from 'react-query';
import { toAsset } from "services/asset";
import { SigningCosmWasmClient } from '@cosmjs/cosmwasm-stargate'
import { SimulationResponse, ReverseSimulationResponse } from "types";

type QuerySimulate = {
    client: SigningCosmWasmClient;
    token: string;
    isNative: boolean;
    amount: string;
    reverse: boolean;
    swapAddress: string;
}

type SwapSimulate = {
    client: SigningCosmWasmClient;
    token: string;
    isNative: boolean;
    amount: string;
    reverse: boolean;
    swapAddress: string;
    enabled: boolean;
}

export type Simulated = {
    amount: string;
    spread: string;
    commission: string;
    price: number;
    error?: string
}


const simulate = ({
    client,
    token,
    amount,
    isNative,
    reverse = false,
    swapAddress
}: QuerySimulate): Promise<SimulationResponse | ReverseSimulationResponse> => {

    if (reverse) {
        return client?.queryContractSmart(swapAddress, {
            reverse_simulation: {
                ask_asset: toAsset({ token, amount , isNative}),
            },
        });
    }

    return client?.queryContractSmart(swapAddress, {
        simulation: {
            offer_asset: toAsset({ token, amount, isNative }),
        }
    })
};

const useSimulate = ({
    client,
    token,
    amount,
    isNative,
    reverse = false,
    swapAddress,
    enabled
}: SwapSimulate) => {

    const { data, isLoading, error } = useQuery<any>(["simulation", token, amount, reverse, swapAddress], () => {
        if (token == null || amount == '') return

        return simulate({
            client,
            token,
            isNative,
            amount,
            reverse,
            swapAddress
        });
    },
        {
            enabled: !!client && amount?.length > 0 && enabled && !!swapAddress,
            onError: (err) => console.log(err)
        },
    );


    const simulatedError = useMemo(() => {
        if (!error) return null

        if (/unreachable: query wasm contract failed: invalid request/i.test(error?.toString()))
            return "Insuifficient liquidity"

    }, [error])




    const simulatedData = useMemo(() => {
        if (data == null || amount == '') {
            return null;
        }

        const spread = data.spread_amount;
        const commission = data.commission_amount;


        if (reverse) {
            return {
                amount: data.offer_amount,
                spread,
                commission,
                price: Number(data.offer_amount) / Number(amount)
            };
        }

        return {
            amount: data.return_amount,
            spread,
            commission,
            price: Number(amount) / Number(data.return_amount)
        };
    }, [amount, data, isLoading]);

    return {
        simulated: simulatedData,
        error: simulatedError,
        isLoading
    }


}

export default useSimulate