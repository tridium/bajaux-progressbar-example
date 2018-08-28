/*
 * Copyright 2018 Tridium, Inc. All Rights Reserved.
 */
package com.tridiumemea.bajauxprogressbar;

import javax.baja.naming.BOrd;
import javax.baja.nre.annotations.NiagaraType;
import javax.baja.sys.BSingleton;
import javax.baja.sys.Context;
import javax.baja.sys.Sys;
import javax.baja.sys.Type;
import javax.baja.web.BIFormFactorCompact;
import javax.baja.web.BIOffline;
import javax.baja.web.js.BIJavaScript;
import javax.baja.web.js.JsInfo;

/**
 * A simple progress bar gauge.
 *
 * @author Gareth Johnson
 */
@NiagaraType
public final class BProgressBarGauge
  extends BSingleton
  implements BIJavaScript, BIFormFactorCompact, BIOffline
{
  private BProgressBarGauge() {}

  @SuppressWarnings("unused")
  public static final BProgressBarGauge INSTANCE = new BProgressBarGauge();

/*+ ------------ BEGIN BAJA AUTO GENERATED CODE ------------ +*/
/*@ $com.tridiumemea.bajauxprogressbar.BProgressBarGauge(2979906276)1.0$ @*/
/* Generated Tue Aug 28 10:21:23 BST 2018 by Slot-o-Matic (c) Tridium, Inc. 2012 */

////////////////////////////////////////////////////////////////
// Type
////////////////////////////////////////////////////////////////
  
  @Override
  public Type getType() { return TYPE; }
  public static final Type TYPE = Sys.loadType(BProgressBarGauge.class);

/*+ ------------ END BAJA AUTO GENERATED CODE -------------- +*/

  @Override
  public JsInfo getJsInfo(Context cx) { return jsInfo; }

  private static final JsInfo jsInfo =
    JsInfo.make(BOrd.make("module://bajauxProgressBar/rc/ProgressBarGauge.js"));
}