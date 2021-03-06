/**
 * A global state, modelled after
 * https://github.com/mobxjs/mobx/blob/master/src/core/globalstate.ts
 */

// @TODO(shrugs) - add memoize back and use redis or something
// import { memoize } from 'async-decorators'
import IABIItem, { IABIItemInput } from './models/ABIItem'
import Log from './models/Log'
import NodeApi from './models/NodeApi'
import { IOperation, OpCollector } from './Ourbit'
import { enhanceAbiItem, onlySupportedAbiItems } from './utils'

type voidFunc = () => void
type PatchGenerator = voidFunc

type ABIItemSet = IABIItem[]

export class GnarlyGlobals {
  // @TODO(shrugs) - do we need to move this to a contract artifact?
  public abis: { [s: string]: ABIItemSet } = {}
  public api: NodeApi

  public currentReason: string = null
  public currentMeta: any = null
  private opCollector: OpCollector
  private forceGeneratePatches: PatchGenerator

  public getLogs = async (options) => {
    const logs = await this.api.getLogs(options)
    return logs.map((l) => new Log(null, l))
  }

  public setApi = (api: NodeApi) => {
    this.api = api
  }

  public addABI = (address: string, abi: IABIItemInput[]) => {
    this.abis[address.toLowerCase()] = (this.abis[address.toLowerCase()] || [])
      .concat(
        abi
        .filter(onlySupportedAbiItems)
        .map(enhanceAbiItem),
      )
  }

  public getABI = (address: string): ABIItemSet => this.abis[address.toLowerCase()]

  public getMethod = (address: string, methodId: string): IABIItem => {
    // @TODO(shrugs) replace with O(1) precomputed lookup
    return (this.abis[address.toLowerCase()] || [])
      .find((ai) => ai.shortId === methodId)
  }

  public because = (reason: string, meta: any, fn: () => void) => {
    this.currentReason = reason
    this.currentMeta = meta

    this.operation(fn)

    this.currentReason = null
    this.currentMeta = null
  }

  public get reason () {
    return this.currentReason !== null
      ? { key: this.currentReason, meta: this.currentMeta }
      : undefined
  }

  /**
   * Perform an explicit operation, which is most likely order-dependent
   */
  public operation = (fn: voidFunc) => {
    fn()
    this.forceGeneratePatches()
  }

  /**
   * Emit a specific operation, which is not tracked in the local state
   * This should be used for immutable information
   * (namely, event logs)
   */
  public emit = (op: IOperation) => {
    this.opCollector(op)
  }

  public setOpCollector = (fn: OpCollector) => {
    this.opCollector = fn
  }

  public setPatchGenerator = (fn: PatchGenerator) => {
    this.forceGeneratePatches = fn
  }
}

export let globalState: GnarlyGlobals = new GnarlyGlobals()
