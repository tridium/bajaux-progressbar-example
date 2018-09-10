package com.tridiumemea.bajauxprogressbar;

import javax.baja.nre.annotations.NiagaraEnum;
import javax.baja.nre.annotations.NiagaraType;
import javax.baja.nre.annotations.Range;
import javax.baja.sys.BFrozenEnum;
import javax.baja.sys.Sys;
import javax.baja.sys.Type;

@NiagaraType
@NiagaraEnum(
  range = {
    @Range("Line"),
    @Range("Circle"),
    @Range("SemiCircle")
  },
  defaultValue = "Line"
)
public final class BProgressBarType
  extends BFrozenEnum
{
/*+ ------------ BEGIN BAJA AUTO GENERATED CODE ------------ +*/
/*@ $com.tridiumemea.bajauxprogressbar.BProgressBarType(746341737)1.0$ @*/
/* Generated Thu Aug 30 09:52:45 BST 2018 by Slot-o-Matic (c) Tridium, Inc. 2012 */
  
  /** Ordinal value for Line. */
  public static final int LINE = 0;
  /** Ordinal value for Circle. */
  public static final int CIRCLE = 1;
  /** Ordinal value for SemiCircle. */
  public static final int SEMI_CIRCLE = 2;
  
  /** BProgressBarType constant for Line. */
  public static final BProgressBarType Line = new BProgressBarType(LINE);
  /** BProgressBarType constant for Circle. */
  public static final BProgressBarType Circle = new BProgressBarType(CIRCLE);
  /** BProgressBarType constant for SemiCircle. */
  public static final BProgressBarType SemiCircle = new BProgressBarType(SEMI_CIRCLE);
  
  /** Factory method with ordinal. */
  public static BProgressBarType make(int ordinal)
  {
    return (BProgressBarType)Line.getRange().get(ordinal, false);
  }
  
  /** Factory method with tag. */
  public static BProgressBarType make(String tag)
  {
    return (BProgressBarType)Line.getRange().get(tag);
  }
  
  /** Private constructor. */
  private BProgressBarType(int ordinal)
  {
    super(ordinal);
  }
  
  public static final BProgressBarType DEFAULT = Line;

////////////////////////////////////////////////////////////////
// Type
////////////////////////////////////////////////////////////////
  
  @Override
  public Type getType() { return TYPE; }
  public static final Type TYPE = Sys.loadType(BProgressBarType.class);

/*+ ------------ END BAJA AUTO GENERATED CODE -------------- +*/
}
